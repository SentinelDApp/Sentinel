/**
 * @file JobCard.jsx
 * @description SaaS-styled job card component for the Transporter Dashboard.
 * 
 * Design System: "Sentinel SaaS"
 * - Background: White with subtle slate border
 * - Accent: Indigo-600 for interactive elements
 * - Corners: rounded-xl with hover:shadow-xl
 * - Transitions: Smooth 300ms ease-out animations
 */

import PropTypes from 'prop-types';
import { Package, MapPin, ArrowRight, Clock, Truck } from 'lucide-react';

/**
 * Status configuration for pill badge styling
 */
const STATUS_CONFIG = {
  New: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'In Transit': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  Delivered: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  Delayed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

/**
 * JobCard Component - SaaS-styled shipment card
 *
 * @param {Object} props
 * @param {Object} props.job - The shipment job data
 * @param {Function} props.onSelect - Callback when card is clicked
 */
const JobCard = ({ job, onSelect }) => {
  const statusStyle = STATUS_CONFIG[job.status] || STATUS_CONFIG.New;

  const handleClick = () => onSelect(job);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(job);
    }
  };

  return (
    <article
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="
        group
        bg-white rounded-xl
        border border-slate-200
        p-5
        cursor-pointer
        transition-all duration-300 ease-out
        hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        touch-manipulation
      "
      aria-label={`Shipment ${job.id}: ${job.product}, Status: ${job.status}`}
    >
      {/* Header: Status Badge & ID */}
      <div className="flex items-center justify-between mb-4">
        {/* Status Pill Badge */}
        <span
          className={`
            inline-flex items-center gap-1.5
            px-3 py-1 rounded-full
            text-xs font-semibold
            border
            ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {job.status}
        </span>

        {/* Shipment ID */}
        <span className="text-xs font-mono text-slate-400">
          {job.id}
        </span>
      </div>

      {/* Product Name */}
      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
        {job.product}
      </h3>

      {/* Route Visualization */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-4 h-4 text-indigo-500" />
          <span className="truncate max-w-[100px]">{job.origin}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span className="truncate max-w-[100px]">{job.dest}</span>
        </div>
      </div>

      {/* Meta Info Row */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          <span>{job.expectedQuantity} items</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{job.weight}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        className="
          w-full py-2.5 px-4
          bg-indigo-600 hover:bg-indigo-700
          text-white text-sm font-semibold
          rounded-lg
          transition-all duration-200
          flex items-center justify-center gap-2
          group-hover:shadow-lg group-hover:shadow-indigo-600/25
        "
        onClick={(e) => {
          e.stopPropagation();
          onSelect(job);
        }}
        aria-label={`${job.status === 'New' ? 'Start Journey' : 'Update Status'} for ${job.product}`}
      >
        <Truck className="w-4 h-4" />
        {job.status === 'New' ? 'Start Journey' : 'Update Status'}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </article>
  );
};

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    product: PropTypes.string.isRequired,
    origin: PropTypes.string.isRequired,
    dest: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    weight: PropTypes.string.isRequired,
    expectedQuantity: PropTypes.number.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default JobCard;
