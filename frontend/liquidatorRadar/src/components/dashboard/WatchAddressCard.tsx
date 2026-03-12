import { useState } from 'react';
import SectionCard from '../shared/SectionCard';

const WatchAddressCard = () => {
  const [address, setAddress] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleAdd = () => {
    setAddress('');
  };

  return (
    <SectionCard title="Watch Address">
      <div className="flex space-x-2">
        <input
          className="flex-1 bg-brand-dark border-brand-border rounded-lg text-sm focus:ring-brand-cyan focus:border-brand-cyan text-slate-200 px-3 py-2"
          placeholder="0x..."
          type="text"
          value={address}
          onChange={handleChange}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-brand-cyan text-brand-dark font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>
    </SectionCard>
  );
};

export default WatchAddressCard;

