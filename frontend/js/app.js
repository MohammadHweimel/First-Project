
const API_URL = "http://localhost:3000/api/expenses";

let allExpenses = [];

const alertContainer = document.getElementById('alertcontainer');
const loadingSpinner = document.querySelector('.spinner-border');
const tableBody = document.getElementById('expensestablebody');
const filterCategory = document.getElementById('filtercategory');

// Summary Cards Elements
const totalAmountEl = document.getElementById('totalamount');
const totalCountEl = document.getElementById('totalcount');
const highestAmountEl = document.getElementById('highestamount');
const highestTitleEl = document.getElementById('highesttitle');

// Forms & Modal
const addExpenseForm = document.getElementById('addexpenseform');
const editExpenseForm = document.getElementById('editexpenseform');
const editModalEl = document.getElementById('editmodal');
const editModal = new bootstrap.Modal(editModalEl);



function setLoadingSpinner(show) {
    if (show) {
        loadingSpinner.classList.remove('d-none');
    } else {
        loadingSpinner.classList.add('d-none');
    }
}

function showAlert(message, type = 'danger') {
    alertContainer.innerHTML = '';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mb-4`;

    const textNode = document.createTextNode(message);
    alertDiv.appendChild(textNode);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    alertDiv.appendChild(closeBtn);
    alertContainer.appendChild(alertDiv);
}

function getBadgeClass(category) {
    switch (category) {
        case 'Food': return 'bg-success';
        case 'Transport': return 'bg-primary';
        case 'Bills': return 'bg-warning text-dark';
        case 'Entertainment': return 'bg-info text-dark';
        default: return 'bg-secondary';
    }
}


function updateSummary(expenses) {
    const count = expenses.length;
    totalCountEl.textContent = count;

    if (count === 0) {
        totalAmountEl.textContent = '0.00';
        highestAmountEl.textContent = '0.00';
        highestTitleEl.textContent = '-';
        return;
    }

    const total = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    totalAmountEl.textContent = formatCurrency(total);

    let highest = expenses[0];

    for (const item of expenses) {
        if (parseFloat(item.amount) > parseFloat(highest.amount)) {
            highest = item;
        }
    }

    highestAmountEl.textContent = formatCurrency(highest.amount);
    highestTitleEl.textContent = highest.title || '-';
}

function drawTable(expenses) {
    tableBody.innerHTML = '';

    if (expenses.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.className = 'text-center py-4 text-muted';
        emptyCell.textContent = 'No expenses found.';
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
        return;
    }

    expenses.forEach(item => {
        const tr = document.createElement('tr');

        const tdTitle = document.createElement('td');
        tdTitle.textContent = item.title;
        tr.appendChild(tdTitle);

        const tdAmount = document.createElement('td');
        tdAmount.textContent = formatCurrency(item.amount);
        tr.appendChild(tdAmount);

        const tdCategory = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge ${getBadgeClass(item.category)}`;
        badge.textContent = item.category;
        tdCategory.appendChild(badge);
        tr.appendChild(tdCategory);

        const tdDate = document.createElement('td');
        tdDate.textContent = item.date ? item.date.split('T')[0] : '';
        tr.appendChild(tdDate);

        const tdActions = document.createElement('td');
        tdActions.className = 'text-end';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-outline-secondary btn-sm me-2';
        btnEdit.textContent = 'Edit';
        btnEdit.addEventListener('click', () => openEditModal(item));

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn btn-outline-danger btn-sm';
        btnDelete.textContent = 'Delete';
        btnDelete.addEventListener('click', () => deleteExpense(item.id));

        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDelete);
        tr.appendChild(tdActions);

        tableBody.appendChild(tr);
    });
}

async function fetchExpenses() {
    setLoadingSpinner(true);
    try {
        const res = await fetch(API_URL);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to load expenses from the server.');
        }
        allExpenses = await res.json();

renderCategoryChart(allExpenses);
        updateSummary(allExpenses);
        applyFilter();
    } catch (error) {
        showAlert('Could not connect to the server. Please try again later.', 'danger');
    } finally {
        setLoadingSpinner(false);
    }
}

addExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('expensetitle');
    const amountInput = document.getElementById('expenseamount');
    const categoryInput = document.getElementById('category');
    const dateInput = document.getElementById('expensedate');

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    let isValid = true;

    if (!title) {
        titleInput.classList.add('is-invalid');
        isValid = false;
    } else {
        titleInput.classList.remove('is-invalid');
    }

    if (isNaN(amount) || amount <= 0) {
        amountInput.classList.add('is-invalid');
        isValid = false;
    } else {
        amountInput.classList.remove('is-invalid');
    }

    if (!category) {
        categoryInput.classList.add('is-invalid');
        isValid = false;
    } else {
        categoryInput.classList.remove('is-invalid');
    }

    if (!date) {
        dateInput.classList.add('is-invalid');
        isValid = false;
    } else {
        dateInput.classList.remove('is-invalid');
    }

    if (!isValid) {
        return;
    }


    setLoadingSpinner(true);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, category, date })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || data.message || 'Failed to add expense');
        }

        addExpenseForm.reset();
        showAlert('Expense added successfully!', 'success');
        await fetchExpenses();
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        setLoadingSpinner(false);
    }
});

function openEditModal(expense) {
    [
        document.getElementById('edittitle'),
        document.getElementById('editamount'),
        document.getElementById('editcategory'),
        document.getElementById('editdate')
    ].forEach(input => {
        if (input) input.classList.remove('is-invalid');
    });

    document.getElementById('editexpenseid').value = expense.id;
    document.getElementById('edittitle').value = expense.title;
    document.getElementById('editamount').value = expense.amount;
    document.getElementById('editcategory').value = expense.category;
    document.getElementById('editdate').value = expense.date ? expense.date.split('T')[0] : '';

    editModal.show();
}

editExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

const id = document.getElementById('editexpenseid').value;
    const titleInput = document.getElementById('edittitle');
    const amountInput = document.getElementById('editamount');
    const categoryInput = document.getElementById('editcategory');
    const dateInput = document.getElementById('editdate');

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    let isValid = true;

    if (!title) {
        titleInput.classList.add('is-invalid');
        isValid = false;
    } else {
        titleInput.classList.remove('is-invalid');
    }

    if (isNaN(amount) || amount <= 0) {
        amountInput.classList.add('is-invalid');
        isValid = false;
    } else {
        amountInput.classList.remove('is-invalid');
    }

    if (!category) {
        categoryInput.classList.add('is-invalid');
        isValid = false;
    } else {
        categoryInput.classList.remove('is-invalid');
    }

    if (!date) {
        dateInput.classList.add('is-invalid');
        isValid = false;
    } else {
        dateInput.classList.remove('is-invalid');
    }

    if (!isValid) {
        return;
    }

    setLoadingSpinner(true);
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, category, date })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || data.message || 'Failed to update expense');
        }

        editModal.hide();
        showAlert('Expense details successfully updated.', 'success');
        await fetchExpenses();
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        setLoadingSpinner(false);
    }
});

let expenseIdToDelete = null;

const deleteModalEl = document.getElementById('deletemodal');
const deleteModal = new bootstrap.Modal(deleteModalEl);
const confirmDeleteBtn = document.getElementById('confirmdeletebtn');


function deleteExpense(id) {
    expenseIdToDelete = id;
    deleteModal.show();
}


if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!expenseIdToDelete) return;

        deleteModal.hide();
        setLoadingSpinner(true);

        try {
            const res = await fetch(`${API_URL}/${expenseIdToDelete}`, {
                method: 'DELETE'
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to delete expense');
            }

            showAlert('Expense deleted successfully!', 'success');
            await fetchExpenses();
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            setLoadingSpinner(false);
            expenseIdToDelete = null;
        }
    });
}

const searchInput = document.getElementById('search');
const filterMonth = document.getElementById('filtermonth');
const resetFiltersBtn = document.getElementById('resetfiltersbtn');


function applyFilter() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedMonth = filterMonth ? filterMonth.value : ''; 
  const selectedCategory = filterCategory.value;

  const filtered = allExpenses.filter(item => {
    const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm);

    const itemMonth = item.date ? item.date.split('T')[0].substring(0, 7) : '';
    const matchesMonth = !selectedMonth || itemMonth === selectedMonth;

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesMonth && matchesCategory;
  });

  drawTable(filtered);
}

if (searchInput) searchInput.addEventListener('input', applyFilter);
if (filterMonth) filterMonth.addEventListener('change', applyFilter);
filterCategory.addEventListener('change', applyFilter);

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (filterMonth) filterMonth.value = '';
    filterCategory.value = 'All';
    applyFilter();
  });
}

function formatCurrency(amount, currency = 'JOD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

const formInputs = [
  document.getElementById('expensetitle'),
  document.getElementById('expenseamount'),
  document.getElementById('category'),
  document.getElementById('expensedate'),
  
  document.getElementById('edittitle'),
  document.getElementById('editamount'),
  document.getElementById('editcategory'),
  document.getElementById('editdate')
];

formInputs.forEach(input => {
  if (input) {
    input.addEventListener('input', () => input.classList.remove('is-invalid'));
    input.addEventListener('change', () => input.classList.remove('is-invalid'));
  }
});

filterCategory.addEventListener('change', applyFilter);

const themeBtn = document.getElementById('themetoggleBtn');

themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    
    document.getElementById('themeicon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    document.getElementById('themetext').textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

    renderCategoryChart(allExpenses);
});

let myChart = null; 

function renderCategoryChart(expenses) {
  const ctx = document.getElementById('categorychart');

  const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const borderColor = isDarkMode ? '#1e1e1e' : '#ffffff';

  const categoryTotals = {};
  expenses.forEach(item => {
    const cat = item.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#4e94c0',
          '#386D8F',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ],
        borderWidth: 2,
        borderColor: borderColor,
        hoverBorderColor: borderColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { size: 12 }
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', fetchExpenses);