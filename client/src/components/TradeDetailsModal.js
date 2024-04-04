import React from 'react';
import translateStatus from './utils/statusTranslation';

const TradeDetailsModal = ({ trade, isOpen, onClose }) => {
  if (!isOpen || !trade) return null;

  return (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
      <div className="relative top-80 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Trade Details</h3>
          <div className="mt-2 px-7 py-3 space-y-3">
            <DetailItem label="Trade-ID" value={trade._id} />
            <DetailItem label="Status" value={translateStatus(trade.status)} status={trade.status} />
            <DetailItem label="Käufer" value={trade.sender?.username || trade.sender} />
            <DetailItem label="Verkäufer" value={trade.receiver?.username || trade.receiver} />
            <DetailItem label="Datum" value={new Date(trade.createdAt).toLocaleDateString()} />
            <DetailItem label="Uhrzeit" value={new Date(trade.createdAt).toLocaleTimeString()} />
            <DetailItem label="Betreff" value={trade.subject} />
            <DetailItem label="Initiales Angebot" value={`${trade.initOffer.toFixed(2)}€`} />
            <DetailItem label="Geeinigter Preis" value={trade.acceptedPrice ? `${trade.acceptedPrice.toFixed(2)}€` : '-'} />
            <DetailItem label="Gegenangebot-Historie" value={trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')} />
          </div>
          <div className="items-center px-4 py-3">
            <button id="ok-btn" className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" onClick={onClose}>
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, status }) => (
  <div className="flex justify-between items-center">
    <span className="font-semibold">{label}:</span>
    <span className={`${status === 'confirmed' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : status === 'pending' ? 'text-yellow-500' : 'text-gray-500'}`}>
      {value}
    </span>
  </div>
);

export default TradeDetailsModal;
