
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
    totalAmountEl.textContent = total.toFixed(2);

    let highest = expenses[0];

    for (const item of expenses) {
        if (parseFloat(item.amount) > parseFloat(highest.amount)) {
            highest = item;
        }
    }

    highestAmountEl.textContent = parseFloat(highest.amount).toFixed(2);
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
        tdAmount.textContent = parseFloat(item.amount).toFixed(2);
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

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    setLoadingSpinner(true);
    try {
        const res = await fetch(`${API_URL}/${id}`, {
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
    }
}

function applyFilter() {
  const selectedCategory = filterCategory.value;
  if (selectedCategory === 'All') {
    drawTable(allExpenses);
  } else {
    const filtered = allExpenses.filter(item => item.category === selectedCategory);
    drawTable(filtered);
  }
}

filterCategory.addEventListener('change', applyFilter);

const themeBtn = document.getElementById('themetoggleBtn');

themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    
    document.getElementById('themeicon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    document.getElementById('themetext').textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
});

document.addEventListener('DOMContentLoaded', fetchExpenses);