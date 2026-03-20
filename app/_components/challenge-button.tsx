"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import ChallengeModal from "./challenge-modal";

type ChallengeButtonProps = {
  targetId: string;
  targetAlias: string;
  /** Called before opening the modal. Return false to prevent opening. */
  onBeforeOpen?: () => boolean;
  /** Called after a challenge is successfully created. */
  onSuccess?: () => void;
};

export default function ChallengeButton({
  targetId,
  targetAlias,
  onBeforeOpen,
  onSuccess,
}: ChallengeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  function handleClick() {
    if (onBeforeOpen) {
      const allowed = onBeforeOpen();
      if (!allowed) return;
    }
    setShowModal(true);
  }

  function handleClose(created?: boolean) {
    setShowModal(false);
    if (created && onSuccess) {
      onSuccess();
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="omega-btn omega-btn-red text-sm px-5 py-2.5 mt-3"
      >
        <Swords className="size-4" />
        Retar
      </button>

      {showModal && (
        <ChallengeModal
          targetId={targetId}
          targetAlias={targetAlias}
          onClose={handleClose}
        />
      )}
    </>
  );
}
