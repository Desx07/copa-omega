import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dceypgpgxusebiaofwpb.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZXlwZ3BneHVzZWJpYW9md3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQzNjMzNCwiZXhwIjoyMDg5MDEyMzM0fQ.nvo7MmPmpnP32nVS2Kihls8pYAjye6vwxSjzYQqnyvI";

export const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export const TEST_USERS = {
  admin: { email: "test-admin@copaomega.test", password: "TestAdmin123!", alias: "TestAdmin", name: "Test Admin" },
  player1: { email: "test-player1@copaomega.test", password: "TestPlayer1!", alias: "TestBlade1", name: "Test Player 1" },
  player2: { email: "test-player2@copaomega.test", password: "TestPlayer2!", alias: "TestBlade2", name: "Test Player 2" },
  player3: { email: "test-player3@copaomega.test", password: "TestPlayer3!", alias: "TestBlade3", name: "Test Player 3" },
  player4: { email: "test-player4@copaomega.test", password: "TestPlayer4!", alias: "TestBlade4", name: "Test Player 4" },
};

export async function createTestUser(userData: typeof TEST_USERS.admin) {
  // Check if user already exists
  const { data: existing } = await adminSupabase
    .from("players")
    .select("id")
    .eq("alias", userData.alias)
    .maybeSingle();

  if (existing) return existing.id;

  // Create auth user
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: { full_name: userData.name, alias: userData.alias },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      // Get existing user
      const { data: users } = await adminSupabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === userData.email);
      return user?.id;
    }
    throw error;
  }

  // Update player profile
  if (data.user) {
    await adminSupabase
      .from("players")
      .update({ alias: userData.alias, full_name: userData.name })
      .eq("id", data.user.id);
  }

  return data.user?.id;
}

export async function makeAdmin(userId: string) {
  await adminSupabase
    .from("players")
    .update({ is_admin: true })
    .eq("id", userId);
}

export async function seedTestData() {
  // Create all test users
  const adminId = await createTestUser(TEST_USERS.admin);
  const p1Id = await createTestUser(TEST_USERS.player1);
  const p2Id = await createTestUser(TEST_USERS.player2);
  const p3Id = await createTestUser(TEST_USERS.player3);
  const p4Id = await createTestUser(TEST_USERS.player4);

  if (adminId) await makeAdmin(adminId);

  return { adminId, p1Id, p2Id, p3Id, p4Id };
}

export async function cleanupTestData() {
  // Delete test users by email pattern
  const { data: users } = await adminSupabase.auth.admin.listUsers();
  const testUsers = users?.users?.filter(u => u.email?.endsWith("@copaomega.test")) ?? [];

  for (const user of testUsers) {
    // Delete player data first (cascading should handle most)
    await adminSupabase.from("players").delete().eq("id", user.id);
    await adminSupabase.auth.admin.deleteUser(user.id);
  }

  // Clean up test tournaments
  await adminSupabase.from("tournaments").delete().like("name", "Test%");
}
