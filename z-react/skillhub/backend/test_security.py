
from shared.security import (
    hash_password,
    verify_password
)

password = "Arun@123"

hashed = hash_password(password)

print("Original Password:", password)
print("Hashed Password:", hashed)

is_valid = verify_password(
    "Arun@123",
    hashed
)

print("Correct Password:", is_valid)

is_invalid = verify_password(
    "Wrong123",
    hashed
)

print("Wrong Password:", is_invalid)
