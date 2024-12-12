"use client"

import { types } from '@/types';
import Game from './game';
import styles from './page.module.css';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

function PseudoModal({ pseudo, setPseudo, handleSubmit }: { pseudo: types.Player | null, setPseudo: (p: types.Player) => void, handleSubmit: () => void }) {
  return (
    <>
      <div id={styles.modal}>
        <div>
          <h2>Entre ton nom</h2>
          <form>
            <input
              type="text"
              value={pseudo || ''}
              onChange={(e) => setPseudo(e.target.value as types.Player)}
            />
            <button
              onClick={handleSubmit}
              type='submit'
              className={styles.boutonBombe}
            >
              Jouer
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [pseudo, setPseudo] = useState<types.Player | null>(null);

  function handleSubmit() {
    if (pseudo && pseudo.trim()) {
      console.log('Player Pseudo:', pseudo);
      setIsModalOpen(false); // Close the modal
    } else {
      alert('Please enter a valid pseudo');
    }
  };


  const room = usePathname().split('/').pop();
  return (
    isModalOpen ? <PseudoModal pseudo={pseudo} setPseudo={setPseudo} handleSubmit={handleSubmit} />
      : (pseudo && <Game room={room as types.RoomId} pseudo={pseudo} />)
  );
}