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
  Home
} from "lucide-react";

// Standard icon components with consistent styling classes
export const HomeIcon = () => (
  <Home className="detail-icon" size={14} strokeWidth={2} />
);
export const CoordinatesIcon = () => (
  <MapPin className="detail-icon" size={14} strokeWidth={2} />
);

export const AddressIcon = () => (
  <Map className="detail-icon" size={14} strokeWidth={2} />
);

export const CalendarIcon = () => (
  <Calendar className="detail-icon" size={14} strokeWidth={2} />
);

export const DollarIcon = () => (
  <DollarSign className="detail-icon" size={14} strokeWidth={2} />
);

export const PlaneIcon = () => (
  <Plane className="detail-icon" size={14} strokeWidth={2} style={{ transform: "rotate(45deg)" }} />
);

export const UserIcon = () => (
  <User className="detail-icon" size={14} strokeWidth={2} />
);

export const UsersIcon = () => (
  <Users className="detail-icon" size={14} strokeWidth={2} />
);

export const ArrowRightIcon = () => (
  <ArrowRight className="detail-icon" size={14} strokeWidth={2} />
);

export const TrendingUpIcon = () => (
  <TrendingUp className="detail-icon" size={14} strokeWidth={2} />
);

export const AlertTriangleIcon = () => (
  <AlertTriangle className="detail-icon" size={14} strokeWidth={2} />
);

export const ClockIcon = () => (
  <Clock className="detail-icon" size={14} strokeWidth={2} />
);
