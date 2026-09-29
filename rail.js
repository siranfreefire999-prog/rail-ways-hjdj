```javascript
// app.js
// Make sure your HTML loads this file as:
// <script type="module" src="app.js"></script>

// ============================================================
// FIREBASE
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA91f-rFpSMFCTIioC_fnIlbYXZXFaZRx4",
  authDomain: "rail-c7115.firebaseapp.com",
  projectId: "rail-c7115",
  storageBucket: "rail-c7115.firebasestorage.app",
  messagingSenderId: "493193847567",
  appId: "1:493193847567:web:c9a7392f1001665f0a147a",
  measurementId: "G-TVVG0LKJ1K"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);


// ============================================================
// TRAIN DATA
// ============================================================

const trains = [
  {
    number: "12951",
    name: "Mumbai Rajdhani Express",
    from: "Mumbai",
    to: "Delhi",
    departure: "16:35",
    arrival: "08:35 (+1 day)",
    duration: "16h 00m",
    days: ["Mon", "Wed", "Fri", "Sun"],
    fare: {
      "1A": 4590,
      "2A": 2890,
      "3A": 1950,
      "SL": 720,
      "CC": 0
    },
    seats: {
      "1A": 12,
      "2A": 32,
      "3A": 54,
      "SL": 120,
      "CC": 0
    }
  },

  {
    number: "12627",
    name: "Karnataka Express",
    from: "Bengaluru",
    to: "Delhi",
    departure: "20:20",
    arrival: "13:00 (+2 days)",
    duration: "40h 40m",
    days: ["Daily"],
    fare: {
      "1A": 5250,
      "2A": 3150,
      "3A": 2160,
      "SL": 860,
      "CC": 0
    },
    seats: {
      "1A": 8,
      "2A": 24,
      "3A": 44,
      "SL": 200,
      "CC": 0
    }
  },

  {
    number: "12030",
    name: "Amritsar Shatabdi",
    from: "Delhi",
    to: "Amritsar",
    departure: "16:30",
    arrival: "22:45",
    duration: "6h 15m",
    days: ["Daily"],
    fare: {
      "EC": 2550,
      "CC": 1450
    },
    seats: {
      "EC": 18,
      "CC": 48
    }
  },

  {
    number: "18520",
    name: "Mumbai-Visakhapatnam Express",
    from: "Mumbai",
    to: "Visakhapatnam",
    departure: "11:05",
    arrival: "17:50 (+1 day)",
    duration: "30h 45m",
    days: ["Tue", "Fri", "Sat"],
    fare: {
      "1A": 4150,
      "2A": 2830,
      "3A": 1995,
      "SL": 770,
      "CC": 0
    },
    seats: {
      "1A": 6,
      "2A": 18,
      "3A": 60,
      "SL": 140,
      "CC": 0
    }
  }
];


// ============================================================
// DOM ELEMENTS
// ============================================================

const searchForm = document.querySelector("#searchForm");
const travelClassSelect = document.querySelector("#travelClass");
const trainResults = document.querySelector("#trainResults");
const resultCount = document.querySelector("#resultCount");
const bookingStep2 = document.querySelector("#bookingStep2");
const changeSelectionBtn = document.querySelector("#changeSelection");
const passengerForm = document.querySelector("#passengerForm");
const toast = document.querySelector("#toast");
const historyList = document.querySelector("#historyList");
const recentRoutesList = document.querySelector("#recentRoutesList");
const navPills = document.querySelectorAll(".nav-pill");
const bookingCard = document.querySelector(".booking-card");

const selectedTrainNameEl =
  document.querySelector("#selectedTrainName");

const selectedTrainRouteEl =
  document.querySelector("#selectedTrainRoute");

const selectedTrainClassEl =
  document.querySelector("#selectedTrainClass");

const selectedTrainFareEl =
  document.querySelector("#selectedTrainFare");

const selectedTrainSeatsEl =
  document.querySelector("#selectedTrainSeats");

const fareCalendarLabel =
  document.querySelector("#fareCalendarLabel");


// ============================================================
// LOCAL STORAGE KEYS
// ============================================================

const historyKey = "rrs-history";
const routesKey = "rrs-routes";


// ============================================================
// APPLICATION STATE
// ============================================================

let selectedTrain = null;
let selectedClass = null;
let searchFilters = {};


// ============================================================
// FIREBASE ANALYTICS HELPER
// ============================================================

function trackEvent(eventName, eventData = {}) {
  try {
    logEvent(analytics, eventName, eventData);
    console.log(`Firebase event: ${eventName}`, eventData);
  } catch (error) {
    console.warn("Firebase Analytics error:", error);
  }
}


// ============================================================
// INITIALIZE CLASS OPTIONS
// ============================================================

function initClassOptions() {
  const classes = new Set();

  trains.forEach((train) => {
    Object.keys(train.fare).forEach((cls) => {
      classes.add(cls);
    });
  });

  const docFrag = document.createDocumentFragment();

  classes.forEach((cls) => {
    const option = document.createElement("option");

    option.value = cls;
    option.textContent = cls;

    docFrag.appendChild(option);
  });

  travelClassSelect.appendChild(docFrag);
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}


// ============================================================
// FORMAT DAYS
// ============================================================

function formatDays(days) {
  return days.length > 1
    ? days.join(" · ")
    : days[0];
}


// ============================================================
// RENDER TRAINS
// ============================================================

function renderTrains(list) {
  trainResults.innerHTML = "";

  resultCount.textContent =
    `${list.length} result${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    trainResults.innerHTML = `
      <p class="muted">
        No trains found. Try changing class, quota, or date.
      </p>
    `;

    return;
  }

  list.forEach((train) => {
    const resultCard = document.createElement("article");

    resultCard.className = "result-card";

    const routeInfo = `${train.from} → ${train.to}`;

    resultCard.innerHTML = `
      <div class="result-top">
        <div>
          <div class="train-title">
            ${train.number} · ${train.name}
          </div>

          <div class="train-route">
            <span>${routeInfo}</span>
            <span>
              ${train.departure} — ${train.arrival}
            </span>
            <span>${train.duration}</span>
            <span>${formatDays(train.days)}</span>
          </div>
        </div>

        <span class="muted">
          Quota:
          ${searchFilters.quota?.toUpperCase() || "GENERAL"}
        </span>
      </div>

      <table class="availability-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Fare (₹)</th>
            <th>Seats</th>
            <th>Select</th>
          </tr>
        </thead>

        <tbody>
          ${Object.keys(train.fare)
            .map((cls) => {
              const fare = train.fare[cls];
              const seats = train.seats[cls] ?? 0;

              if (!fare) {
                return "";
              }

              const disabled =
                seats === 0 ? "disabled" : "";

              return `
                <tr>
                  <td>${cls}</td>

                  <td>${fare}</td>

                  <td>
                    ${
                      seats > 0
                        ? `${seats} available`
                        : "Waitlist"
                    }
                  </td>

                  <td>
                    <button
                      class="select-btn"
                      data-class="${cls}"
                      ${disabled}
                    >
                      ${seats > 0 ? "Select" : "WL"}
                    </button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;

    resultCard
      .querySelectorAll(".select-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const cls = btn.dataset.class;

          if (train.seats[cls] === 0) {
            showToast(
              "Selected class is waitlisted. Choose another class."
            );

            return;
          }

          selectedTrain = train;
          selectedClass = cls;

          trackEvent("select_train", {
            train_number: train.number,
            train_name: train.name,
            travel_class: cls,
            route: `${train.from}-${train.to}`
          });

          populatePassengerStep(train, cls);

          bookingStep2.classList.remove("hidden");

          bookingStep2.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        });
      });

    trainResults.appendChild(resultCard);
  });
}


// ============================================================
// POPULATE PASSENGER STEP
// ============================================================

function populatePassengerStep(train, cls) {
  selectedTrainNameEl.textContent =
    `${train.number} · ${train.name}`;

  selectedTrainRouteEl.textContent =
    `${train.from} → ${train.to} | ` +
    `${train.departure} — ${train.arrival} | ` +
    `${train.duration}`;

  selectedTrainClassEl.textContent = cls;

  selectedTrainFareEl.textContent =
    train.fare[cls];

  selectedTrainSeatsEl.textContent =
    train.seats[cls];

  fareCalendarLabel.textContent =
    buildFareCalendar(train.fare[cls]);
}


// ============================================================
// FARE CALENDAR
// ============================================================

function buildFareCalendar(baseFare) {
  const date = searchFilters.date
    ? new Date(searchFilters.date)
    : new Date();

  const windows = [...Array(3)].map((_, idx) => {
    const next = new Date(date);

    next.setDate(next.getDate() + idx);

    const dd = next.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short"
      }
    );

    const fareVariant =
      baseFare + idx * 35;

    return `${dd}: ₹${fareVariant}`;
  });

  return `Fare calendar · ${windows.join(" | ")}`;
}


// ============================================================
// SEARCH
// ============================================================

function applySearch(filters) {
  searchFilters = filters;

  const from =
    filters.from.trim().toLowerCase();

  const to =
    filters.to.trim().toLowerCase();

  const travelClass =
    filters.class;

  const filtered = trains.filter((train) => {
    const matchesFrom =
      train.from.toLowerCase().includes(from);

    const matchesTo =
      train.to.toLowerCase().includes(to);

    const classes =
      Object.keys(train.fare);

    const classOk =
      travelClass === "any" ||
      classes.includes(travelClass);

    const seatsOk =
      travelClass === "any"
        ? classes.some(
            (cls) =>
              (train.seats[cls] ?? 0) > 0
          )
        : (train.seats[travelClass] ?? 0) > 0;

    return (
      matchesFrom &&
      matchesTo &&
      classOk &&
      seatsOk
    );
  });

  renderTrains(filtered);

  saveRecentRoute(filters);

  // Firebase Analytics
  trackEvent("search_trains", {
    from: filters.from,
    to: filters.to,
    travel_class: filters.class || "any",
    quota: filters.quota || "general"
  });
}


// ============================================================
// SAVE RECENT ROUTE
// ============================================================

function saveRecentRoute(filters) {
  if (!filters.from || !filters.to) {
    return;
  }

  const routes =
    JSON.parse(
      localStorage.getItem(routesKey) || "[]"
    );

  const routeKey =
    `${filters.from.toLowerCase()}-${filters.to.toLowerCase()}`;

  const existingIndex =
    routes.findIndex(
      (item) => item.key === routeKey
    );

  const record = {
    key: routeKey,
    from: filters.from,
    to: filters.to,
    date: filters.date || "",
    time: new Date().toLocaleString()
  };

  if (existingIndex >= 0) {
    routes.splice(existingIndex, 1);
  }

  routes.unshift(record);

  const limited =
    routes.slice(0, 5);

  localStorage.setItem(
    routesKey,
    JSON.stringify(limited)
  );

  renderRecentRoutes();
}


// ============================================================
// RENDER RECENT ROUTES
// ============================================================

function renderRecentRoutes() {
  const routes =
    JSON.parse(
      localStorage.getItem(routesKey) || "[]"
    );

  if (!routes.length) {
    recentRoutesList.innerHTML = `
      <p class="muted small">
        Search a route to pin it here for faster repeats.
      </p>
    `;

    return;
  }

  recentRoutesList.innerHTML =
    routes
      .map(
        (route) => `
          <div class="route-pill">
            <button data-route="${route.key}">
              ${route.from} → ${route.to}
            </button>

            <small class="muted">
              ${route.time}
            </small>
          </div>
        `
      )
      .join("");

  recentRoutesList
    .querySelectorAll(
      "button[data-route]"
    )
    .forEach((btn) => {
      btn.addEventListener(
        "click",
        () => {
          const [
            from,
            to
          ] = btn.dataset.route.split("-");

          searchForm.from.value =
            capitalize(from);

          searchForm.to.value =
            capitalize(to);

          applySearch({
            from: capitalize(from),
            to: capitalize(to),
            date: searchForm.date.value,
            quota: searchForm.quota.value,
            class: searchForm.class.value,
            passengers:
              searchForm.passengers.value
          });

          trackEvent(
            "recent_route_selected",
            {
              from: capitalize(from),
              to: capitalize(to)
            }
          );

          bookingCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      );
    });
}


// ============================================================
// CAPITALIZE
// ============================================================

function capitalize(str) {
  return (
    str.charAt(0).toUpperCase() +
    str.slice(1)
  );
}


// ============================================================
// LOAD BOOKING HISTORY
// ============================================================

function loadHistory() {
  const history =
    JSON.parse(
      localStorage.getItem(historyKey) || "[]"
    );

  if (!history.length) {
    historyList.innerHTML = `
      <p class="muted small">
        Confirmed tickets will appear here.
      </p>
    `;

    return;
  }

  historyList.innerHTML =
    history
      .map(
        (item) => `
          <div class="history-card">
            <strong>${item.train}</strong>

            <span>${item.route}</span>
```
