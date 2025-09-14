// background.js
// Service worker that manages alarms and notifications.

const DAILY_SHIFT_ALARM = "dailyShift";
const HOURLY_ALARM = "hourlyReminder";
const TASK_ALARM_PREFIX = "task-";

// Utilities
function getNextOccurrence(hour, minute, todayIfAfterNow = true) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    // if time already passed today, schedule next day
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

function timeStringToHM(timeStr) {
  // expects "HH:MM"
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  return { hh, mm };
}

function scheduleHourlyReminder() {
  chrome.alarms.create(HOURLY_ALARM, { periodInMinutes: 60 });
}

function scheduleDailyShiftAt21() {
  // compute next 21:00 (9 PM) and create an alarm
  const now = new Date();
  const next = new Date(now);
  next.setHours(21, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  chrome.alarms.create(DAILY_SHIFT_ALARM, { when: next.getTime() });
}

// Remove all task alarms (we will reschedule)
function clearTaskAlarmsAndReschedule(allTasks) {
  // first clear existing task alarms
  chrome.alarms.getAll((alarms) => {
    const toClear = alarms.filter(a => a.name && a.name.startsWith(TASK_ALARM_PREFIX));
    toClear.forEach(a => chrome.alarms.clear(a.name));
    // schedule new ones
    scheduleAlarmsForTasks(allTasks);
  });
}

function scheduleAlarmsForTasks(tasksObj) {
  // tasksObj expected shape: { today: [], tomorrow: [], dayAfter: [] }
  // schedule each timed task in the bucket that will be active on the day it belongs to.
  const buckets = ["today", "tomorrow", "dayAfter"];
  buckets.forEach((bucket, offsetDays) => {
    (tasksObj[bucket] || []).forEach(task => {
      if (task.time) {
        const hm = timeStringToHM(task.time);
        if (!hm) return;
        // schedule alarm for the next occurrence of that hh:mm for the appropriate day offset
        const now = new Date();
        const alarmTime = new Date(now);
        alarmTime.setDate(now.getDate() + offsetDays);
        alarmTime.setHours(hm.hh, hm.mm, 0, 0);
        // if scheduled time already passed for the date (e.g., adding a tomorrow task with time earlier than now),
        // we want it to fire next day occurrence accordingly — but that's fine because a tomorrow bucket means offsetDays>=1.
        // Ensure we schedule for the computed date/time
        if (alarmTime.getTime() <= Date.now()) {
          // push forward to next possible day (1 day)
          alarmTime.setDate(alarmTime.getDate() + 1);
        }
        chrome.alarms.create(TASK_ALARM_PREFIX + task.id, { when: alarmTime.getTime() });
      }
    });
  });
}

function showNotification(id, title, message) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: title,
    message: message,
    priority: 2
  }, () => {});
}

// Build message from list of tasks (limit to a few chars)
function buildShortListMessage(tasks) {
  if (!tasks || tasks.length === 0) return "";
  const lines = tasks.slice(0, 5).map(t => (t.time ? `${t.time} ` : "") + t.text);
  return lines.join("\n");
}

// Alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HOURLY_ALARM) {
    // hourly: show unscheduled today's tasks (tasks without time)
    chrome.storage.local.get(["tasks"], (res) => {
      const tasks = res.tasks || { today: [] };
      const unscheduled = (tasks.today || []).filter(t => !t.time);
      if (unscheduled.length > 0) {
        showNotification("hourly-tasks", "Hourly Task Reminder", buildShortListMessage(unscheduled));
      }
    });
  } else if (alarm.name === DAILY_SHIFT_ALARM) {
    // run shifting job (Tomorrow->Today, DayAfter->Tomorrow, Today cleared)
    chrome.storage.local.get(["tasks"], (res) => {
      const tasks = res.tasks || { today: [], tomorrow: [], dayAfter: [] };
      const newToday = tasks.tomorrow || [];
      const newTomorrow = tasks.dayAfter || [];
      const newDayAfter = [];
      const newStore = {
        today: newToday,
        tomorrow: newTomorrow,
        dayAfter: newDayAfter
      };
      chrome.storage.local.set({ tasks: newStore }, () => {
        showNotification("daily-shift", "Daily Shift Done", "Tomorrow -> Today; Day After -> Tomorrow; Today's tasks cleared.");
        // reschedule the next daily shift at 21:00 tomorrow
        scheduleDailyShiftAt21();
      });
    });
  } else if (alarm.name && alarm.name.startsWith(TASK_ALARM_PREFIX)) {
    // task-specific alarm: extract id
    const id = alarm.name.slice(TASK_ALARM_PREFIX.length);
    chrome.storage.local.get(["tasks"], (res) => {
      const tasks = res.tasks || { today: [], tomorrow: [], dayAfter: [] };
      // search for task by id in any bucket and show notification if found and not completed
      const all = [...(tasks.today||[]), ...(tasks.tomorrow||[]), ...(tasks.dayAfter||[])];
      const t = all.find(x => x.id === id);
      if (t) {
        // if the task is scheduled but user already removed it, skip
        showNotification("task-" + id, "Task Reminder", (t.time ? `${t.time} · ` : "") + t.text);
      }
    });
  }
});

// On install/startup: set alarms
chrome.runtime.onInstalled.addListener(() => {
  scheduleHourlyReminder();
  scheduleDailyShiftAt21();
  // schedule timed task alarms if any
  chrome.storage.local.get(["tasks"], (res) => {
    const tasks = res.tasks || { today: [], tomorrow: [], dayAfter: [] };
    scheduleAlarmsForTasks(tasks);
  });
});

chrome.runtime.onStartup.addListener(() => {
  // On startup, show a reminder similar to hourly reminder
  chrome.storage.local.get(["tasks"], (res) => {
    const tasks = res.tasks || { today: [] };
    const unscheduled = (tasks.today || []).filter(t => !t.time);
    if (unscheduled.length > 0) {
      showNotification("startup-reminder", "Welcome — Today's Tasks", buildShortListMessage(unscheduled));
    }
  });
  // ensure hourly & daily alarms exist
  scheduleHourlyReminder();
  scheduleDailyShiftAt21();
  chrome.storage.local.get(["tasks"], (res) => {
    scheduleAlarmsForTasks(res.tasks || { today: [], tomorrow: [], dayAfter: [] });
  });
});

// When storage changes, update task alarms
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.tasks) {
    const newTasks = changes.tasks.newValue || { today: [], tomorrow: [], dayAfter: [] };
    // clear existing task alarms and schedule new ones
    clearTaskAlarmsAndReschedule(newTasks);
  }
});

// Make sure we have hourly/daily alarms running even if service worker wakes later
// (This helps resilience)
setTimeout(() => {
  chrome.alarms.getAll((alarms) => {
    const names = alarms.map(a => a.name);
    if (!names.includes(HOURLY_ALARM)) scheduleHourlyReminder();
    if (!names.includes(DAILY_SHIFT_ALARM)) scheduleDailyShiftAt21();
  });
}, 2000);
