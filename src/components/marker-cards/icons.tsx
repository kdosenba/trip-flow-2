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
} from "lucide-react";

// Standard icon components with consistent styling classes
export const HomeIcon = () => (
  <Home className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
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

export const UserIcon = () => (
  <User className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
);

export const UsersIcon = () => (
  <Users className="shrink-0 text-text-muted" size={14} strokeWidth={2} />
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
