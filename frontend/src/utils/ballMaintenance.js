/**
 * Ball Maintenance Tracking System
 * Comprehensive system for tracking bowling ball usage and maintenance
 */

export class BallMaintenanceTracker {
  constructor() {
    this.maintenanceData = this.loadMaintenanceData();
    this.maintenanceSchedule = this.initializeMaintenanceSchedule();
    this.reminders = this.loadReminders();
  }

  // Load maintenance data from storage
  loadMaintenanceData() {
    const stored = localStorage.getItem('ball-maintenance-data');
    return stored ? JSON.parse(stored) : {};
  }

  // Save maintenance data
  saveMaintenanceData() {
    localStorage.setItem('ball-maintenance-data', JSON.stringify(this.maintenanceData));
  }

  // Load reminders
  loadReminders() {
    const stored = localStorage.getItem('ball-maintenance-reminders');
    return stored ? JSON.parse(stored) : [];
  }

  // Save reminders
  saveReminders() {
    localStorage.setItem('ball-maintenance-reminders', JSON.stringify(this.reminders));
  }

  // Initialize maintenance schedule templates
  initializeMaintenanceSchedule() {
    return {
      cleaning: {
        after_every_session: {
          name: 'Post-Session Cleaning',
          description: 'Clean ball after every bowling session',
          frequency: 'after_session',
          importance: 'critical',
          tasks: [
            'Wipe down with microfiber cloth',
            'Remove oil and debris',
            'Check for visible damage'
          ]
        },
        deep_clean_weekly: {
          name: 'Weekly Deep Clean',
          description: 'Thorough cleaning once per week',
          frequency: 'weekly',
          importance: 'high',
          tasks: [
            'Clean with ball cleaner',
            'Remove all oil residue',
            'Polish if needed',
            'Inspect finger holes'
          ]
        }
      },
      resurfacing: {
        light_resurface: {
          name: 'Light Resurfacing',
          description: 'Light surface maintenance',
          frequency: 'every_60_games',
          importance: 'medium',
          cost_estimate: 25,
          tasks: [
            'Light sanding with 2000/4000 grit',
            'Restore surface texture',
            'Check track flare'
          ]
        },
        full_resurface: {
          name: 'Full Resurfacing',
          description: 'Complete surface restoration',
          frequency: 'every_150_games',
          importance: 'high',
          cost_estimate: 45,
          tasks: [
            'Complete surface restoration',
            'Remove scratches and gouges',
            'Apply new surface finish'
          ]
        }
      },
      deep_maintenance: {
        oil_extraction: {
          name: 'Oil Extraction',
          description: 'Remove absorbed oil from ball core',
          frequency: 'every_100_games',
          importance: 'medium',
          cost_estimate: 35,
          tasks: [
            'Heat treatment to extract oil',
            'Restore ball reaction',
            'Check weight distribution'
          ]
        },
        plug_and_redrill: {
          name: 'Plug and Re-drill',
          description: 'Change finger hole layout',
          frequency: 'as_needed',
          importance: 'low',
          cost_estimate: 75,
          tasks: [
            'Plug existing holes',
            'Re-drill new layout',
            'Test fit and adjust'
          ]
        }
      },
      storage: {
        proper_storage: {
          name: 'Proper Storage',
          description: 'Store ball correctly between sessions',
          frequency: 'always',
          importance: 'medium',
          tasks: [
            'Store in cool, dry place',
            'Avoid extreme temperatures',
            'Use ball bag or case',
            'Keep away from direct sunlight'
          ]
        }
      }
    };
  }

  // Initialize ball maintenance tracking
  initializeBallMaintenance(ballId, ballData = {}) {
    if (!this.maintenanceData[ballId]) {
      this.maintenanceData[ballId] = {
        ball_id: ballId,
        ball_info: ballData,
        total_games: 0,
        total_sessions: 0,
        purchase_date: ballData.purchase_date || new Date().toISOString(),
        last_cleaned: null,
        last_deep_clean: null,
        last_resurfaced: null,
        last_oil_extraction: null,
        maintenance_history: [],
        upcoming_maintenance: [],
        performance_tracking: {
          hook_potential_decline: false,
          surface_wear: 'minimal',
          oil_absorption_level: 'low'
        },
        reminders_enabled: true,
        custom_schedule: {}
      };
      this.saveMaintenanceData();
    }
    return this.maintenanceData[ballId];
  }

  // Record game usage for a ball
  recordGameUsage(ballId, sessionData = {}) {
    if (!this.maintenanceData[ballId]) {
      this.initializeBallMaintenance(ballId);
    }

    const ballData = this.maintenanceData[ballId];
    ballData.total_games++;
    
    // If this is a new session
    if (sessionData.new_session) {
      ballData.total_sessions++;
    }

    // Update performance tracking based on usage
    this.updatePerformanceTracking(ballId);
    
    // Check for maintenance needs
    this.checkMaintenanceNeeds(ballId);
    
    this.saveMaintenanceData();
    
    return {
      total_games: ballData.total_games,
      maintenance_needed: this.getMaintenanceNeeds(ballId),
      reminders: this.getActiveReminders(ballId)
    };
  }

  // Record maintenance activity
  recordMaintenance(ballId, maintenanceType, details = {}) {
    if (!this.maintenanceData[ballId]) {
      this.initializeBallMaintenance(ballId);
    }

    const ballData = this.maintenanceData[ballId];
    const now = new Date().toISOString();
    
    const maintenanceRecord = {
      id: Date.now(),
      type: maintenanceType,
      date: now,
      details: details.description || '',
      cost: details.cost || 0,
      location: details.location || '',
      notes: details.notes || '',
      performed_by: details.performed_by || 'self'
    };

    ballData.maintenance_history.push(maintenanceRecord);

    // Update last maintenance dates
    switch (maintenanceType) {
      case 'cleaning':
        ballData.last_cleaned = now;
        break;
      case 'deep_clean':
        ballData.last_deep_clean = now;
        break;
      case 'resurfacing':
      case 'light_resurface':
      case 'full_resurface':
        ballData.last_resurfaced = now;
        break;
      case 'oil_extraction':
        ballData.last_oil_extraction = now;
        break;
    }

    // Remove completed reminders
    this.removeCompletedReminders(ballId, maintenanceType);
    
    // Reset performance tracking if major maintenance
    if (['resurfacing', 'oil_extraction'].includes(maintenanceType)) {
      ballData.performance_tracking = {
        hook_potential_decline: false,
        surface_wear: 'minimal',
        oil_absorption_level: 'low'
      };
    }

    this.saveMaintenanceData();
    this.updateReminders();

    return maintenanceRecord;
  }

  // Check what maintenance is needed for a ball
  getMaintenanceNeeds(ballId) {
    const ballData = this.maintenanceData[ballId];
    if (!ballData) return [];

    const needs = [];
    const now = new Date();

    // Check cleaning needs
    if (!ballData.last_cleaned || 
        this.daysSince(ballData.last_cleaned) > 1) {
      needs.push({
        type: 'cleaning',
        urgency: 'high',
        reason: 'Should clean after every session',
        overdue_by: this.daysSince(ballData.last_cleaned) || 1
      });
    }

    // Check deep cleaning needs
    if (!ballData.last_deep_clean || 
        this.daysSince(ballData.last_deep_clean) > 7) {
      needs.push({
        type: 'deep_clean',
        urgency: 'medium',
        reason: 'Weekly deep clean recommended',
        overdue_by: Math.max(0, this.daysSince(ballData.last_deep_clean) - 7)
      });
    }

    // Check resurfacing needs
    const gamesSinceResurf = this.gamesSinceMaintenance(ballId, 'resurfacing');
    if (gamesSinceResurf >= 60) {
      needs.push({
        type: 'light_resurface',
        urgency: gamesSinceResurf >= 80 ? 'high' : 'medium',
        reason: `${gamesSinceResurf} games since last resurfacing`,
        overdue_by: Math.max(0, gamesSinceResurf - 60)
      });
    }

    if (gamesSinceResurf >= 150) {
      needs.push({
        type: 'full_resurface',
        urgency: 'high',
        reason: `${gamesSinceResurf} games since last full resurfacing`,
        overdue_by: gamesSinceResurf - 150
      });
    }

    // Check oil extraction needs
    const gamesSinceOil = this.gamesSinceMaintenance(ballId, 'oil_extraction');
    if (gamesSinceOil >= 100) {
      needs.push({
        type: 'oil_extraction',
        urgency: gamesSinceOil >= 120 ? 'high' : 'medium',
        reason: `${gamesSinceOil} games since oil extraction`,
        overdue_by: Math.max(0, gamesSinceOil - 100)
      });
    }

    return needs.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  // Check maintenance needs and create reminders
  checkMaintenanceNeeds(ballId) {
    const needs = this.getMaintenanceNeeds(ballId);
    const ballData = this.maintenanceData[ballId];
    
    if (!ballData.reminders_enabled) return;

    needs.forEach(need => {
      // Don't create duplicate reminders
      const existingReminder = this.reminders.find(r => 
        r.ball_id === ballId && r.maintenance_type === need.type
      );
      
      if (!existingReminder) {
        this.createReminder(ballId, need);
      }
    });
  }

  // Create a maintenance reminder
  createReminder(ballId, maintenanceNeed) {
    const ballData = this.maintenanceData[ballId];
    const reminder = {
      id: Date.now() + Math.random(),
      ball_id: ballId,
      ball_name: ballData.ball_info?.name || `Ball ${ballId}`,
      maintenance_type: maintenanceNeed.type,
      urgency: maintenanceNeed.urgency,
      reason: maintenanceNeed.reason,
      created_at: new Date().toISOString(),
      dismissed: false,
      completed: false
    };

    this.reminders.push(reminder);
    this.saveReminders();
    
    return reminder;
  }

  // Get active reminders for a ball
  getActiveReminders(ballId) {
    return this.reminders.filter(r => 
      r.ball_id === ballId && !r.dismissed && !r.completed
    );
  }

  // Get all active reminders
  getAllActiveReminders() {
    return this.reminders.filter(r => !r.dismissed && !r.completed);
  }

  // Dismiss a reminder
  dismissReminder(reminderId) {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.dismissed = true;
      this.saveReminders();
    }
  }

  // Remove completed reminders
  removeCompletedReminders(ballId, maintenanceType) {
    this.reminders = this.reminders.filter(r => 
      !(r.ball_id === ballId && r.maintenance_type === maintenanceType)
    );
    this.saveReminders();
  }

  // Update performance tracking
  updatePerformanceTracking(ballId) {
    const ballData = this.maintenanceData[ballId];
    const totalGames = ballData.total_games;

    // Track hook potential decline
    if (totalGames > 100 && !ballData.last_oil_extraction) {
      ballData.performance_tracking.hook_potential_decline = true;
      ballData.performance_tracking.oil_absorption_level = 'high';
    }

    // Track surface wear
    const gamesSinceResurf = this.gamesSinceMaintenance(ballId, 'resurfacing');
    if (gamesSinceResurf > 80) {
      ballData.performance_tracking.surface_wear = 'high';
    } else if (gamesSinceResurf > 40) {
      ballData.performance_tracking.surface_wear = 'medium';
    }
  }

  // Helper function to calculate days since a date
  daysSince(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper function to calculate games since last maintenance
  gamesSinceMaintenance(ballId, maintenanceType) {
    const ballData = this.maintenanceData[ballId];
    if (!ballData) return 0;

    // Find the most recent maintenance of this type
    const lastMaintenance = ballData.maintenance_history
      .filter(m => m.type === maintenanceType || m.type.includes(maintenanceType))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!lastMaintenance) {
      return ballData.total_games;
    }

    // Count games since that maintenance
    // In a real implementation, you'd track games more precisely
    return ballData.total_games;
  }

  // Get maintenance history for a ball
  getMaintenanceHistory(ballId) {
    const ballData = this.maintenanceData[ballId];
    if (!ballData) return [];

    return ballData.maintenance_history.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }

  // Get maintenance statistics
  getMaintenanceStats(ballId) {
    const ballData = this.maintenanceData[ballId];
    if (!ballData) return null;

    const history = ballData.maintenance_history;
    const totalCost = history.reduce((sum, m) => sum + (m.cost || 0), 0);
    const maintenanceCount = history.length;
    
    const maintenanceTypes = {};
    history.forEach(m => {
      maintenanceTypes[m.type] = (maintenanceTypes[m.type] || 0) + 1;
    });

    return {
      total_games: ballData.total_games,
      total_sessions: ballData.total_sessions,
      total_maintenance_cost: totalCost,
      maintenance_count: maintenanceCount,
      maintenance_by_type: maintenanceTypes,
      cost_per_game: ballData.total_games > 0 ? totalCost / ballData.total_games : 0,
      ball_age_days: this.daysSince(ballData.purchase_date),
      performance_status: ballData.performance_tracking
    };
  }

  // Get all balls maintenance overview
  getAllBallsOverview() {
    return Object.values(this.maintenanceData).map(ballData => {
      const needs = this.getMaintenanceNeeds(ballData.ball_id);
      const stats = this.getMaintenanceStats(ballData.ball_id);
      
      return {
        ball_id: ballData.ball_id,
        ball_info: ballData.ball_info,
        stats,
        maintenance_needs: needs,
        urgent_needs: needs.filter(n => n.urgency === 'high').length,
        last_maintained: this.getLastMaintenanceDate(ballData.ball_id)
      };
    });
  }

  // Get last maintenance date
  getLastMaintenanceDate(ballId) {
    const ballData = this.maintenanceData[ballId];
    if (!ballData || ballData.maintenance_history.length === 0) return null;

    const lastMaintenance = ballData.maintenance_history
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    return lastMaintenance.date;
  }

  // Update all reminders
  updateReminders() {
    Object.keys(this.maintenanceData).forEach(ballId => {
      this.checkMaintenanceNeeds(ballId);
    });
  }

  // Export maintenance data
  exportMaintenanceData(ballId = null) {
    if (ballId) {
      return {
        ball_data: this.maintenanceData[ballId],
        reminders: this.getActiveReminders(ballId),
        exported_at: new Date().toISOString()
      };
    }
    
    return {
      all_balls: this.maintenanceData,
      all_reminders: this.reminders,
      exported_at: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const ballMaintenanceTracker = new BallMaintenanceTracker();