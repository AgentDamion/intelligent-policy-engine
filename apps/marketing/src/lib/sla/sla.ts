/**
 * SLA calculation utilities for business hours and timezone support
 */

export interface SlaPolicy {
  decision_due_business_hours: number;
  timezone: string;
  business_hours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  business_days: number[]; // [1,2,3,4,5] for Mon-Fri
}

export interface SlaBreachResult {
  timeRemaining: string;
  isBreached: boolean;
  urgencyLevel: 'normal' | 'warning' | 'urgent';
  businessHoursRemaining: number;
}

export const slaUtils = {
  /**
   * Check if a given time is within business hours
   */
  isBusinessHour(date: Date, policy: SlaPolicy): boolean {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const time = date.toTimeString().slice(0, 5); // "HH:MM"
    
    return policy.business_days.includes(day) &&
           time >= policy.business_hours.start &&
           time < policy.business_hours.end;
  },

  /**
   * Add business hours to a date
   */
  addBusinessHours(startDate: Date, hoursToAdd: number, policy: SlaPolicy): Date {
    const result = new Date(startDate);
    let hoursAdded = 0;
    
    while (hoursAdded < hoursToAdd) {
      result.setHours(result.getHours() + 1);
      
      if (this.isBusinessHour(result, policy)) {
        hoursAdded++;
      }
    }
    
    return result;
  },

  /**
   * Calculate business hours between two dates
   */
  businessHoursBetween(startDate: Date, endDate: Date, policy: SlaPolicy): number {
    let hours = 0;
    const current = new Date(startDate);
    
    while (current < endDate) {
      if (this.isBusinessHour(current, policy)) {
        hours++;
      }
      current.setHours(current.getHours() + 1);
    }
    
    return hours;
  },

  /**
   * Compute SLA breach status with business hours consideration
   */
  computeBreach(submittedAt: string, slaHours: number, timezone = 'UTC'): SlaBreachResult {
    const startDate = new Date(submittedAt);
    const now = new Date();
    
    // Default policy - would be fetched per client in real implementation
    const policy: SlaPolicy = {
      decision_due_business_hours: slaHours,
      timezone,
      business_hours: { start: '09:00', end: '18:00' },
      business_days: [1, 2, 3, 4, 5] // Mon-Fri
    };

    const dueDate = this.addBusinessHours(startDate, slaHours, policy);
    const businessHoursElapsed = this.businessHoursBetween(startDate, now, policy);
    const businessHoursRemaining = Math.max(0, slaHours - businessHoursElapsed);
    
    const isBreached = now > dueDate;
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let urgencyLevel: 'normal' | 'warning' | 'urgent' = 'normal';
    if (isBreached) {
      urgencyLevel = 'urgent';
    } else if (hoursUntilDue <= 2) {
      urgencyLevel = 'urgent';
    } else if (hoursUntilDue <= 6) {
      urgencyLevel = 'warning';
    }

    const timeRemaining = this.formatTimeRemaining(businessHoursRemaining, isBreached);

    return {
      timeRemaining,
      isBreached,
      urgencyLevel,
      businessHoursRemaining
    };
  },

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(businessHours: number, isBreached: boolean): string {
    if (isBreached) {
      return `${Math.abs(businessHours)}h overdue`;
    }
    
    if (businessHours <= 0) {
      return 'Due now';
    }
    
    if (businessHours < 1) {
      return `${Math.round(businessHours * 60)}m left`;
    }
    
    if (businessHours < 24) {
      return `${Math.round(businessHours)}h left`;
    }
    
    const days = Math.floor(businessHours / 8); // 8 business hours per day
    const remainingHours = businessHours % 8;
    
    if (remainingHours === 0) {
      return `${days}d left`;
    }
    
    return `${days}d ${Math.round(remainingHours)}h left`;
  }
};