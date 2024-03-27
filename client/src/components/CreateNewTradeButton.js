import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateNewTradeButton = ({ isOpen, onClose, onSuccess }) => {

  return (
    <div className="modal">      
        <label>
          Empfänger:         
        </label>
        <label>
          Angebot:         
        </label>

        <button type="submit">Angebot senden</button>
        <button type="button" onClick={onClose}>Abbrechen</button>      
    </div>
  );
};

export default CreateNewTradeButton;
