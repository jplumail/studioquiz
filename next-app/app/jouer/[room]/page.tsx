"use client"

import { types } from '@/types';
import Game from './game';


import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function PseudoModal({ pseudo, setPseudo, handleSubmit }: { pseudo: types.Player | null, setPseudo: (p: types.Player) => void, handleSubmit: () => void }) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent backdrop
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h2>Enter your name</h2>
          <input
            type="text"
            value={pseudo || ''}
            onChange={(e) => setPseudo(e.target.value as types.Player)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
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