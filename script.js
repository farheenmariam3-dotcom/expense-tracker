// ---------- Load saved data from localStorage ----------
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budget = Number(localStorage.getItem("budget")) || 0;
let myChart = null;

// ---------- Set today's date in the date box ----------
function setTodayDate() {
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();

  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }

  document.getElementById("date").value = year + "-" + month + "-" + day;
}

// ---------- Save data to localStorage ----------
function saveData() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("budget", budget);
}

// ---------- Get current month like "2026-11" ----------
function getCurrentMonth() {
  let today = new Date();
  let month = today.getMonth() + 1;
  if (month < 10) {
    month = "0" + month;
  }
  return today.getFullYear() + "-" + month;
}

// ---------- Add a new expense ----------
function addExpense() {
  let amount = Number(document.getElementById("amount").value);
  let category = document.getElementById("category").value;
  let date = document.getElementById("date").value;
  let note = document.getElementById("note").value;
  let mood = document.getElementById("mood").value;

  // check if amount and date are filled
  if (amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }
  if (date == "") {
    alert("Please select a date");
    return;
  }

  let expense = {
    id: Date.now(),
    amount: amount,
    category: category,
    date: date,
    note: note,
    mood: mood
  };

  expenses.push(expense);
  saveData();

  // clear the form
  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";

  updateAll();
}

// ---------- Delete an expense ----------
function deleteExpense(id) {
  let newList = [];
  for (let i = 0; i < expenses.length; i++) {
    if (expenses[i].id != id) {
      newList.push(expenses[i]);
    }
  }
  expenses = newList;
  saveData();
  updateAll();
}

// ---------- Set the monthly budget ----------
function setBudget() {
  let value = Number(document.getElementById("budgetInput").value);

  if (value <= 0) {
    alert("Please enter a valid budget");
    return;
  }

  budget = value;
  saveData();
  document.getElementById("budgetInput").value = "";
  updateAll();
}

// ---------- Change mood word into emoji ----------
function getMoodEmoji(mood) {
  if (mood == "happy") {
    return "😊";
  } else if (mood == "okay") {
    return "😐";
  } else {
    return "😬";
  }
}

// ---------- Show expenses in the table ----------
function showExpenses() {
  let filter = document.getElementById("filter").value;
  let list = document.getElementById("expenseList");
  list.innerHTML = "";

  // sort so newest date comes first
  expenses.sort(function (a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  let count = 0;

  for (let i = 0; i < expenses.length; i++) {
    let e = expenses[i];

    if (filter == "All" || filter == e.category) {
      let row = "<tr>" +
        "<td>" + e.date + "</td>" +
        "<td>" + e.category + "</td>" +
        "<td>" + e.note + "</td>" +
        "<td>" + getMoodEmoji(e.mood) + "</td>" +
        "<td>₹" + e.amount + "</td>" +
        "<td><button class='delete-btn' onclick='deleteExpense(" + e.id + ")'>Delete</button></td>" +
        "</tr>";

      list.innerHTML += row;
      count++;
    }
  }

  // show message if no expenses
  if (count == 0) {
    document.getElementById("emptyMessage").style.display = "block";
  } else {
    document.getElementById("emptyMessage").style.display = "none";
  }
}

// ---------- Update the summary cards and budget bar ----------
function updateSummary() {
  let currentMonth = getCurrentMonth();
  let total = 0;
  let regret = 0;

  for (let i = 0; i < expenses.length; i++) {
    // only count this month's expenses
    if (expenses[i].date.startsWith(currentMonth)) {
      total = total + expenses[i].amount;

      if (expenses[i].mood == "regret") {
        regret = regret + expenses[i].amount;
      }
    }
  }

  document.getElementById("totalSpent").innerText = "₹" + total;
  document.getElementById("budgetShow").innerText = "₹" + budget;
  document.getElementById("regretMoney").innerText = "₹" + regret;

  // find how many days are left in this month
  let today = new Date();
  let lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  let daysLeft = lastDay - today.getDate() + 1;

  // safe to spend per day = money left / days left
  let moneyLeft = budget - total;
  let safe = 0;
  if (moneyLeft > 0) {
    safe = Math.floor(moneyLeft / daysLeft);
  }
  document.getElementById("safeToSpend").innerText = "₹" + safe;

  // budget progress bar
  let bar = document.getElementById("progressFill");
  let message = document.getElementById("budgetMessage");

  if (budget == 0) {
    bar.style.width = "0%";
    message.innerText = "Set a budget to start tracking.";
    return;
  }

  let percent = (total / budget) * 100;
  if (percent > 100) {
    percent = 100;
  }
  bar.style.width = percent + "%";

  if (total > budget) {
    bar.style.backgroundColor = "#e74c3c";
    message.innerText = "⚠️ You have crossed your budget by ₹" + (total - budget) + "!";
  } else if (percent >= 80) {
    bar.style.backgroundColor = "#f39c12";
    message.innerText = "Careful! You have used " + Math.round(percent) + "% of your budget.";
  } else {
    bar.style.backgroundColor = "#2ecc71";
    message.innerText = "Good going! You have ₹" + moneyLeft + " left this month.";
  }
}

// ---------- Draw the pie chart ----------
function drawChart() {
  let currentMonth = getCurrentMonth();
  let categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];
  let totals = [0, 0, 0, 0, 0, 0, 0];

  for (let i = 0; i < expenses.length; i++) {
    if (expenses[i].date.startsWith(currentMonth)) {
      let index = categories.indexOf(expenses[i].category);
      totals[index] = totals[index] + expenses[i].amount;
    }
  }

  // remove old chart before drawing a new one
  if (myChart != null) {
    myChart.destroy();
  }

  let canvas = document.getElementById("myChart");

  myChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{
        data: totals,
        backgroundColor: ["#f6b93b", "#4a69bd", "#e55039", "#78e08f", "#9b59b6", "#38ada9", "#95a5a6"]
      }]
    }
  });
}

// ---------- Clear everything ----------
function clearAll() {
  let sure = confirm("Are you sure you want to delete all data?");
  if (sure) {
    expenses = [];
    budget = 0;
    saveData();
    updateAll();
  }
}

// ---------- Update everything on the page ----------
function updateAll() {
  showExpenses();
  updateSummary();
  drawChart();
}

// ---------- Run when page loads ----------
setTodayDate();
updateAll();