from app.database.database import engine
from sqlalchemy import text

# Change this to your user's email
USER_EMAIL = "poojajgohel2@gmail.com"

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET role = 'admin' WHERE email = :email RETURNING username"),
        {"email": USER_EMAIL}
    )
    conn.commit()
    
    user = result.fetchone()
    if user:
        print(f"User '{user[0]}' is now an admin!")
    else:
        print(f"User with email '{USER_EMAIL}' not found")
