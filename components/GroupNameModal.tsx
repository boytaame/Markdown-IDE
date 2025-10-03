import React, { useState } from 'react';

interface GroupNameModalProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
  title?: string;
}

const GroupNameModal: React.FC<GroupNameModalProps> = ({ onClose, onSubmit, title = "Create a new group" }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Group name..."
            autoFocus
          />
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-text-secondary hover:bg-secondary mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-accent text-white hover:bg-opacity-80 disabled:opacity-50"
              disabled={!name.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupNameModal;
