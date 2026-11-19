
from shared.database import test_connection

try:
    database_name = test_connection()
    print("Database connected successfully!")
    print("Connected database:", database_name)

except Exception as error:
    print("Database connection failed!")
    print(type(error).__name__, str(error))
