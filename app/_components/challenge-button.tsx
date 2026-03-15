"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import ChallengeModal from "./challenge-modal";

type ChallengeButtonProps = {
  targetId: string;
  targetAlias: string;
};

export default function ChallengeButton({
  targetId,
  targetAlias,
}: ChallengeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="omega-btn omega-btn-red text-sm px-5 py-2.5 mt-3"
      >
        <Swords className="size-4" />
        Retar
      </button>

      {showModal && (
        <ChallengeModal
          targetId={targetId}
          targetAlias={targetAlias}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
