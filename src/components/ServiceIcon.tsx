import React from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Smile, 
  Baby, 
  Zap, 
  Scissors, 
  Award, 
  HeartHandshake, 
  Stethoscope 
} from "lucide-react";

export function ServiceIcon({ iconName, className = "w-6 h-6 text-teal-600" }: { iconName: string, className?: string }) {
  switch (iconName) {
    case "ShieldCheck": 
      return <ShieldCheck className={className} id={`icon-${iconName}`} />;
    case "Sparkles": 
      return <Sparkles className={className} id={`icon-${iconName}`} />;
    case "Activity": 
      return <Activity className={className} id={`icon-${iconName}`} />;
    case "Smile": 
      return <Smile className={className} id={`icon-${iconName}`} />;
    case "Baby": 
      return <Baby className={className} id={`icon-${iconName}`} />;
    case "Zap": 
      return <Zap className={className} id={`icon-${iconName}`} />;
    case "Scissors": 
      return <Scissors className={className} id={`icon-${iconName}`} />;
    case "Award": 
      return <Award className={className} id={`icon-${iconName}`} />;
    case "HeartHandshake": 
      return <HeartHandshake className={className} id={`icon-${iconName}`} />;
    default: 
      return <Stethoscope className={className} id="icon-default" />;
  }
}

export const renderServiceIcon = (iconName: string, className = "w-6 h-6 text-teal-600") => {
  return <ServiceIcon iconName={iconName} className={className} />;
};
