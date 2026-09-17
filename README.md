# TrackWise - Personal Finance Manager

TrackWise is a full-stack personal finance management application designed to help users manage their income, expenses, wallets, budgets, and financial analytics in one place.

The application provides a simple and user-friendly dashboard where users can track their financial activities, monitor wallet balances, manage spending limits, and understand their financial habits.

---

## Features

### Authentication

- User registration and login
- Secure authentication using JWT
- Protected routes for authenticated users
- User-specific financial data

### Dashboard

- View total wallet balance
- View total income
- View total expenses
- View net savings
- Quick access to financial modules

### Wallet Management

- Create and manage wallets
- View wallet balance
- Update wallet details
- Delete wallets when required
- Maintain separate balances for different wallets

### Category Management

- Create income and expense categories
- View available categories
- Update category details
- Delete categories
- Organize transactions based on categories

### Transaction Management

- Add income transactions
- Add expense transactions
- View all transactions
- Filter transactions by:
  - Wallet
  - Category
  - Transaction type
  - Start date
  - End date
- Update transactions
- Soft-delete transactions
- Automatically update wallet balances

### Wallet Balance Validation

TrackWise prevents users from creating an expense when the expense amount is greater than the available wallet balance.

For example:

- Wallet balance: ₹1,000
- Expense amount: ₹1,500
- Result: Transaction is rejected with an insufficient balance message.

This prevents wallet balances from becoming negative through normal transactions.

### Budget Management

- Create budgets
- Set spending limits
- Track budget usage
- Monitor spending against planned limits

### Financial Analytics

- View income and expense summaries
- Monitor net savings
- Analyze financial activity
- View monthly financial information
- Export financial reports

### Responsive User Interface

- Clean and modern dashboard
- Responsive layout
- Sidebar navigation
- Separate pages for wallets, transactions, budgets, analytics, and profile

---

## Technology Stack

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- SQLAlchemy
- PostgreSQL
- Marshmallow
- PyJWT
- Flask-CORS
- python-dotenv

### Frontend

- React
- JavaScript
- HTML
- CSS
- Modern responsive UI

> Update this section if the frontend uses any additional framework or library.

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- Python Virtual Environment

---

## Project Structure

```text
TrackWise/
│
├── app/
│   ├── __init__.py
│   │
│   ├── core/
│   │   ├── constants.py
│   │   ├── exceptions.py
│   │   ├── utils/
│   │   │   └── datetime.py
│   │   └── ...
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── models.py
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── services/
│   │   │
│   │   └── finance/
│   │       ├── models.py
│   │       ├── routes.py
│   │       ├── schemas.py
│   │       ├── repositories/
│   │       └── services/
│   │           ├── wallet_service.py
│   │           ├── category_service.py
│   │           ├── transaction_service.py
│   │           └── ...
│   │
│   ├── extensions.py
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── migrations/
│
├── tests/
│
├── .env
├── .gitignore
├── requirements.txt
├── run.py
└── README.md
```

> The structure may vary slightly depending on the current project implementation.

---

## Prerequisites

Before running TrackWise, make sure the following are installed:

- Python 3.10 or above
- Node.js and npm
- PostgreSQL
- Git
- VS Code or any preferred code editor

---

## Backend Setup

### 1. Clone the Repository

```bash
https://github.com/shaikhsaif72/TrackWise.git
```

Move into the project directory:

```bash
cd TrackWise
```

---

### 2. Create a Virtual Environment

For Windows:

```bash
python -m venv venv
```

Activate the virtual environment:

```bash
venv\Scripts\activate
```

For macOS/Linux:

```bash
source venv/bin/activate
```

---

### 3. Install Backend Dependencies

Install all required Python packages:

```bash
pip install -r requirements.txt
```

If `requirements.txt` does not exist, generate it using:

```bash
pip freeze > requirements.txt
```

---

### 4. Configure Environment Variables

Create a `.env` file in the project root directory.

Example:

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/trackwise

JWT_SECRET_KEY=your-jwt-secret-key
```

Replace the database username, password, database name, and secret keys with your local values.

### Important

Do not upload the `.env` file to GitHub because it may contain sensitive information such as:

- Database credentials
- Secret keys
- JWT keys
- API keys

---

## Database Setup

### 1. Create a PostgreSQL Database

Open PostgreSQL or pgAdmin and create a database named:

```text
trackwise
```

Example PostgreSQL command:

```sql
CREATE DATABASE trackwise;
```

---

### 2. Run Database Migrations

If Flask-Migrate is configured, run:

```bash
flask db upgrade
```

If migrations need to be initialized for the first time:

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

> Run `flask db init` only if the migrations folder has not already been created.

---

## Running the Backend

Activate the virtual environment and run the backend using the project entry point.

If the project uses `run.py`:

```bash
python run.py
```

Alternatively, if Flask CLI is configured:

```bash
flask run
```

The backend will usually be available at:

```text
http://127.0.0.1:5000
```

---

## Frontend Setup

Open a new terminal and move into the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

If the project uses Create React App instead of Vite, use:

```bash
npm start
```

The frontend will usually be available at one of the following URLs:

```text
http://localhost:5173
```

or:

```text
http://localhost:3000
```

---

## API Modules

The backend is organized into modular components.

| Module | Description |
|---|---|
| Authentication | User registration, login, and authentication |
| Wallets | Create, update, view, and manage wallets |
| Categories | Manage income and expense categories |
| Transactions | Manage income and expense transactions |
| Budgets | Create budgets and track spending limits |
| Analytics | View financial summaries and reports |
| Profile | Manage user profile information |

---

## Transaction and Wallet Balance Logic

TrackWise automatically updates wallet balances whenever a transaction is created, updated, or deleted.

### Income Transaction

When an income transaction is created:

```text
New Wallet Balance = Current Balance + Income Amount
```

Example:

```text
Current Balance = ₹5,000
Income = ₹2,000

New Balance = ₹7,000
```

### Expense Transaction

When an expense transaction is created:

```text
New Wallet Balance = Current Balance - Expense Amount
```

Example:

```text
Current Balance = ₹5,000
Expense = ₹1,500

New Balance = ₹3,500
```

### Insufficient Balance Validation

An expense is rejected if:

```text
Expense Amount > Wallet Balance
```

Example:

```text
Wallet Balance = ₹1,000
Expense Amount = ₹1,200
```

Result:

```text
Transaction rejected:
Insufficient wallet balance.
```

### Updating a Transaction

When an existing transaction is updated:

1. The old transaction effect is reversed.
2. The new transaction values are validated.
3. The new transaction effect is applied.
4. The wallet balance is updated safely.
5. Changes are committed to the database.

### Deleting a Transaction

TrackWise uses soft deletion for transactions.

When a transaction is deleted:

- The transaction is marked as deleted.
- The wallet balance is reversed accordingly.
- The transaction is not permanently removed from the database.

---

## Error Handling

The application validates user inputs and returns meaningful error messages.

Examples of handled errors:

- Invalid transaction amount
- Transaction amount less than or equal to zero
- Invalid transaction type
- Wallet not found
- Transaction not found
- Category not found
- Insufficient wallet balance
- Unauthorized access
- Database operation failure

Example error response:

```json
{
  "message": "Insufficient wallet balance. You do not have enough funds to complete this transaction."
}
```

> The exact response format may vary depending on the application's error handler.

---

## Testing

The project can be checked using Python compilation and API testing tools.

### Check Python Files

Run:

```bash
python -m compileall app
```

This checks Python files for syntax errors.

### Run Tests

If tests are available:

```bash
pytest
```

### API Testing

API endpoints can be tested using:

- Postman
- Thunder Client
- Frontend application

Important test cases include:

- User registration
- User login
- Wallet creation
- Income creation
- Expense creation
- Expense greater than wallet balance
- Transaction update
- Transaction deletion
- Budget creation
- Analytics data loading

---

## Environment and Security

The following files and folders should not be committed to GitHub:

```gitignore
venv/
.venv/
__pycache__/
*.py[cod]
*.pyo

.env
.env.*

*.db
*.sqlite
*.sqlite3
instance/

node_modules/
frontend/node_modules/
frontend/dist/
frontend/build/

.vscode/
.idea/

.DS_Store
Thumbs.db
```

Make sure `.env` and virtual environment folders are included in `.gitignore`.

---

## Current Python Dependencies

The backend uses the following major dependencies:

```text
Flask==3.0.2
Flask-CORS==6.0.5
Flask-Migrate==4.0.5
Flask-SQLAlchemy==3.1.1
SQLAlchemy==2.0.27
alembic==1.19.1
marshmallow==3.21.1
psycopg2-binary==2.9.9
PyJWT==2.13.0
python-dotenv==1.0.1
pytest==8.0.2
reportlab==5.0.1
Werkzeug==3.1.8
```

For the complete dependency list, refer to:

```text
requirements.txt
```

---

## Future Enhancements

The following features can be added in future versions:

- Recurring transactions
- Email notifications
- Budget limit alerts
- Advanced financial charts
- CSV and PDF import
- Bank account integration
- Multi-currency support
- Dark mode
- Mobile application
- AI-based financial recommendations
- Spending prediction
- Automated monthly reports

---

## Project Status

```text
Project Status: Completed
```

The core TrackWise modules have been implemented, including:

- Authentication
- Dashboard
- Wallet management
- Category management
- Transaction management
- Budget management
- Financial analytics
- API integration
- Responsive UI
- Error handling
- Wallet balance validation

---

## Author

**Saif Shaikh**

B.Tech Computer Engineering Student

---

## License

This project is created for educational and project development purposes.

You may modify and improve the project according to your requirements.
