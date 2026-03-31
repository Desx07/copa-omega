import { createClient } from "@/lib/supabase/server";

// XP thresholds para evolucionar
const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0 },   // Rookie
  { level: 2, minXp: 100 }, // Champion
  { level: 3, minXp: 300 }, // Ultimate
];

// Stats bonus por level up
const LEVEL_UP_BONUS = 5;

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) return LEVEL_THRESHOLDS[i].level;
  }
  return 1;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { opponent_id, omega_coins_bet } = body;

    if (!opponent_id) {
      return Response.json(
        { error: "Falta opponent_id" },
        { status: 400 }
      );
    }

    if (opponent_id === user.id) {
      return Response.json(
        { error: "No podes pelear contra vos mismo" },
        { status: 400 }
      );
    }

    const bet = typeof omega_coins_bet === "number" ? omega_coins_bet : 0;
    if (bet < 0 || bet > 50) {
      return Response.json(
        { error: "La apuesta debe ser entre 0 y 50 OC" },
        { status: 400 }
      );
    }

    // Obtener ambos beypets
    const { data: beypets, error: bpError } = await supabase
      .from("beypets")
      .select("*")
      .in("player_id", [user.id, opponent_id]);

    if (bpError) {
      return Response.json({ error: bpError.message }, { status: 500 });
    }

    const myPet = beypets?.find((b) => b.player_id === user.id);
    const opPet = beypets?.find((b) => b.player_id === opponent_id);

    if (!myPet) {
      return Response.json(
        { error: "No tenes un BeyPet" },
        { status: 404 }
      );
    }

    if (!opPet) {
      return Response.json(
        { error: "El oponente no tiene un BeyPet" },
        { status: 404 }
      );
    }

    // Verificar energia minima
    if (myPet.energy < 20) {
      return Response.json(
        { error: "Tu BeyPet no tiene suficiente energia (minimo 20)" },
        { status: 400 }
      );
    }

    if (opPet.energy < 20) {
      return Response.json(
        { error: "El BeyPet rival no tiene suficiente energia para pelear" },
        { status: 400 }
      );
    }

    // Cooldown: 5 minutos entre batallas
    if (myPet.last_battle) {
      const lastBattle = new Date(myPet.last_battle);
      const now = new Date();
      const diffMs = now.getTime() - lastBattle.getTime();
      if (diffMs < 5 * 60 * 1000) {
        const waitSecs = Math.ceil((5 * 60 * 1000 - diffMs) / 1000);
        return Response.json(
          { error: `Espera ${waitSecs} segundos para volver a pelear` },
          { status: 429 }
        );
      }
    }

    // Verificar omega_coins si hay apuesta
    if (bet > 0) {
      const { data: players } = await supabase
        .from("players")
        .select("id, omega_coins")
        .in("id", [user.id, opponent_id]);

      const myCoins = players?.find((p) => p.id === user.id)?.omega_coins ?? 0;
      const opCoins = players?.find((p) => p.id === opponent_id)?.omega_coins ?? 0;

      if (myCoins < bet) {
        return Response.json(
          { error: `No tenes suficientes Omega Coins (tenes ${myCoins})` },
          { status: 400 }
        );
      }

      if (opCoins < bet) {
        return Response.json(
          { error: "El oponente no tiene suficientes Omega Coins" },
          { status: 400 }
        );
      }
    }

    // ============================================
    // LOGICA DE BATALLA
    // ============================================
    // ATK atacante + random(1-20) vs DEF defensor + random(1-20)
    // Factor energia: pet con mas energia gana bonus de +3
    // Stamina se suma al roll total como resistencia

    const energyBonus = myPet.energy > opPet.energy ? 3 : opPet.energy > myPet.energy ? -3 : 0;

    const attackerRoll =
      myPet.atk +
      Math.floor(myPet.sta / 3) +
      Math.floor(Math.random() * 20) + 1 +
      energyBonus;

    const defenderRoll =
      opPet.def +
      Math.floor(opPet.sta / 3) +
      Math.floor(Math.random() * 20) + 1 -
      energyBonus;

    const iWin = attackerRoll >= defenderRoll;
    const winnerId = iWin ? user.id : opponent_id;

    // XP: ganador +15, perdedor +5
    const myNewXp = myPet.xp + (iWin ? 15 : 5);
    const opNewXp = opPet.xp + (iWin ? 5 : 15);

    // Calcular nuevos niveles
    const myOldLevel = myPet.level;
    const opOldLevel = opPet.level;
    const myNewLevel = calculateLevel(myNewXp);
    const opNewLevel = calculateLevel(opNewXp);

    // Stats bonus si subieron de nivel
    const myLevelUps = myNewLevel - myOldLevel;
    const opLevelUps = opNewLevel - opOldLevel;

    const myNewAtk = myPet.atk + myLevelUps * LEVEL_UP_BONUS;
    const myNewDef = myPet.def + myLevelUps * LEVEL_UP_BONUS;
    const myNewSta = myPet.sta + myLevelUps * LEVEL_UP_BONUS;

    const opNewAtk = opPet.atk + opLevelUps * LEVEL_UP_BONUS;
    const opNewDef = opPet.def + opLevelUps * LEVEL_UP_BONUS;
    const opNewSta = opPet.sta + opLevelUps * LEVEL_UP_BONUS;

    // Ambos pierden 20 energia
    const myNewEnergy = Math.max(0, myPet.energy - 20);
    const opNewEnergy = Math.max(0, opPet.energy - 20);

    const now = new Date().toISOString();

    // Actualizar ambos beypets
    const [myUpdate, opUpdate] = await Promise.all([
      supabase
        .from("beypets")
        .update({
          xp: myNewXp,
          level: myNewLevel,
          energy: myNewEnergy,
          atk: myNewAtk,
          def: myNewDef,
          sta: myNewSta,
          last_battle: now,
        })
        .eq("id", myPet.id)
        .select()
        .single(),
      supabase
        .from("beypets")
        .update({
          xp: opNewXp,
          level: opNewLevel,
          energy: opNewEnergy,
          atk: opNewAtk,
          def: opNewDef,
          sta: opNewSta,
          last_battle: now,
        })
        .eq("id", opPet.id)
        .select()
        .single(),
    ]);

    if (myUpdate.error || opUpdate.error) {
      return Response.json(
        { error: "Error actualizando beypets" },
        { status: 500 }
      );
    }

    // Transferir omega_coins si hay apuesta
    if (bet > 0) {
      const loserId = iWin ? opponent_id : user.id;

      // Usar RPCs o queries directas
      await Promise.all([
        supabase.rpc("increment_column", {
          table_name: "players",
          column_name: "omega_coins",
          row_id: winnerId,
          amount: bet,
        }).then(
          () => {},
          // Si el RPC no existe, usar update directo
          async () => {
            const { data: winner } = await supabase
              .from("players")
              .select("omega_coins")
              .eq("id", winnerId)
              .single();
            await supabase
              .from("players")
              .update({ omega_coins: (winner?.omega_coins ?? 0) + bet })
              .eq("id", winnerId);
          }
        ),
        supabase.rpc("increment_column", {
          table_name: "players",
          column_name: "omega_coins",
          row_id: loserId,
          amount: -bet,
        }).then(
          () => {},
          async () => {
            const { data: loser } = await supabase
              .from("players")
              .select("omega_coins")
              .eq("id", loserId)
              .single();
            await supabase
              .from("players")
              .update({
                omega_coins: Math.max(0, (loser?.omega_coins ?? 0) - bet),
              })
              .eq("id", loserId);
          }
        ),
      ]);
    }

    // Registrar la batalla
    await supabase.from("beypet_battles").insert({
      attacker_id: user.id,
      defender_id: opponent_id,
      winner_id: winnerId,
      omega_coins_bet: bet,
      attacker_roll: attackerRoll,
      defender_roll: defenderRoll,
    });

    // Insertar en activity feed
    const { data: myPlayer } = await supabase
      .from("players")
      .select("alias")
      .eq("id", user.id)
      .single();

    const { data: opPlayer } = await supabase
      .from("players")
      .select("alias")
      .eq("id", opponent_id)
      .single();

    await supabase.from("activity_feed").insert({
      type: "beypet_battle",
      actor_id: user.id,
      target_id: opponent_id,
      metadata: {
        winner_id: winnerId,
        attacker_alias: myPlayer?.alias,
        defender_alias: opPlayer?.alias,
        attacker_pet: myPet.name,
        defender_pet: opPet.name,
        omega_coins_bet: bet,
        attacker_roll: attackerRoll,
        defender_roll: defenderRoll,
      },
    });

    return Response.json({
      result: iWin ? "win" : "lose",
      winner_id: winnerId,
      attacker_roll: attackerRoll,
      defender_roll: defenderRoll,
      omega_coins_transferred: bet,
      my_pet: myUpdate.data,
      op_pet: opUpdate.data,
      my_leveled_up: myNewLevel > myOldLevel,
      op_leveled_up: opNewLevel > opOldLevel,
    });
  } catch (err) {
    console.error("POST /api/beypets/battle error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
