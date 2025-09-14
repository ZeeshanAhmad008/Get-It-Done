// popup.js
// Manages UI and storage operations.

const ids = {
  todayList: "todayList",
  tomorrowList: "tomorrowList",
  dayAfterList: "dayAfterList"
};

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// default storage schema
const defaultStore = {
  today: [],
  tomorrow: [],
  dayAfter: []
};

function getStore(callback) {
  chrome.storage.local.get(["tasks"], (res) => {
    const tasks = res.tasks || defaultStore;
    callback(tasks);
  });
}

function saveStore(store, callback) {
  chrome.storage.local.set({ tasks: store }, () => {
    if (callback) callback();
  });
}

// Render helpers
function render() {
  getStore((store) => {
    renderList("todayList", store.today, true);
    renderList("tomorrowList", store.tomorrow, false);
    renderList("dayAfterList", store.dayAfter, false);
  });
}

function renderList(listId, arr, isToday) {
  const ul = document.getElementById(listId);
  ul.innerHTML = "";
  arr.forEach((task, idx) => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.className = "task-left";

    if (isToday) {
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = false;
      cb.addEventListener("change", () => {
        // mark complete -> remove
        removeTaskById(task.id);
      });
      left.appendChild(cb);
    }

    const label = document.createElement("div");
    label.className = "task-label";
    label.textContent = task.text + (task.time ? ` · ${task.time}` : "");
    left.appendChild(label);

    li.appendChild(left);

    // controls for future tasks
    const ctrl = document.createElement("div");
    if (!isToday) {
      const editBtn = document.createElement("button");
      editBtn.className = "small";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        editFutureTask(task);
      });
      ctrl.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "small";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        removeTaskById(task.id);
      });
      ctrl.appendChild(delBtn);
    } else {
      // show remove button for today as well (in case user wants to delete manually)
      const delBtn = document.createElement("button");
      delBtn.className = "small";
      delBtn.textContent = "X";
      delBtn.addEventListener("click", () => removeTaskById(task.id));
      ctrl.appendChild(delBtn);
    }

    li.appendChild(ctrl);
    ul.appendChild(li);
  });
}

// add functions
function addTaskTo(bucketName, text, time) {
  if (!text || !text.trim()) return;
  getStore((store) => {
    const list = store[bucketName] || [];
    const task = { id: makeId(), text: text.trim(), time: time || null };
    list.push(task);
    store[bucketName] = list;
    saveStore(store, () => {
      // background will pick up storage change and reschedule alarms
      render();
    });
  });
}

function removeTaskById(id) {
  getStore((store) => {
    ["today", "tomorrow", "dayAfter"].forEach(key => {
      store[key] = (store[key] || []).filter(t => t.id !== id);
    });
    saveStore(store, render);
  });
}

function editFutureTask(task) {
  // simple prompt-based edit to keep UI short
  const newText = prompt("Edit task text:", task.text);
  if (newText === null) return;
  const newTime = prompt("Edit time (HH:MM or empty to remove):", task.time || "");
  getStore((store) => {
    ["tomorrow", "dayAfter"].forEach(key => {
      store[key] = (store[key] || []).map(t => {
        if (t.id === task.id) {
          return { ...t, text: newText.trim(), time: (newTime || "").trim() || null };
        }
        return t;
      });
    });
    saveStore(store, render);
  });
}

// clear helpers
function clearBucket(bucketName) {
  getStore((store) => {
    store[bucketName] = [];
    saveStore(store, render);
  });
}

// event listeners for add buttons
document.getElementById("addToday").addEventListener("click", () => {
  const text = document.getElementById("todayInput").value;
  const time = document.getElementById("todayTime").value || null;
  addTaskTo("today", text, time);
  document.getElementById("todayInput").value = "";
  document.getElementById("todayTime").value = "";
});

document.getElementById("addTomorrow").addEventListener("click", () => {
  const text = document.getElementById("tomorrowInput").value;
  const time = document.getElementById("tomorrowTime").value || null;
  addTaskTo("tomorrow", text, time);
  document.getElementById("tomorrowInput").value = "";
  document.getElementById("tomorrowTime").value = "";
});

document.getElementById("addDayAfter").addEventListener("click", () => {
  const text = document.getElementById("dayAfterInput").value;
  const time = document.getElementById("dayAfterTime").value || null;
  addTaskTo("dayAfter", text, time);
  document.getElementById("dayAfterInput").value = "";
  document.getElementById("dayAfterTime").value = "";
});

document.getElementById("clearTomorrow").addEventListener("click", () => {
  if (confirm("Clear all Tomorrow tasks?")) clearBucket("tomorrow");
});
document.getElementById("clearDayAfter").addEventListener("click", () => {
  if (confirm("Clear all Day After tasks?")) clearBucket("dayAfter");
});

document.getElementById("openSettings").addEventListener("click", () => {
  if (confirm("Reset all tasks (developer reset)?")) {
    saveStore(defaultStore, render);
  }
});

// initial render
document.addEventListener("DOMContentLoaded", () => {
  // if storage empty, ensure default exists
  chrome.storage.local.get(["tasks"], (res) => {
    if (!res.tasks) {
      chrome.storage.local.set({ tasks: defaultStore }, render);
    } else {
      render();
    }
  });
});
