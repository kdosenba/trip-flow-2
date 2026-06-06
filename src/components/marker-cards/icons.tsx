import React from "react";
import {
  MapPin,
  Map,
  Calendar,
  DollarSign,
  Plane,
  Users,
  User,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Home,
  Bed,
  BedDouble,
  Sparkles,
  Utensils,
  Ticket,
} from "lucide-react";

// Standard icon components with consistent styling classes
export const HomeIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <Home className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const BedIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <Bed className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const BedDoubleIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <BedDouble className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const SparklesIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <Sparkles className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const UtensilsIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <Utensils className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const TicketIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <Ticket className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);
export const CoordinatesIcon = () => (
  <MapPin className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const AddressIcon = () => (
  <Map className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const CalendarIcon = () => (
  <Calendar className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const DollarIcon = () => (
  <DollarSign className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const PlaneIcon = () => (
  <Plane
    className="shrink-0 rotate-45 text-text-muted"
    size={14}
    strokeWidth={2}
  />
);

export const UserIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <User className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const UsersIcon = ({ className = "text-text-muted", size = 14 }: { className?: string; size?: number }) => (
  <Users className={`shrink-0 ${className}`} size={size} strokeWidth={2} />
);

export const ArrowRightIcon = () => (
  <ArrowRight className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const TrendingUpIcon = () => (
  <TrendingUp className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const AlertTriangleIcon = () => (
  <AlertTriangle
    className="shrink-0 text-text-muted"
    size={14}
    strokeWidth={2}
  />
);

export const ClockIcon = () => (
  <Clock className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);
