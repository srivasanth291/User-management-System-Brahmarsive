from shared.security import hash_password, verify_password


def test_password_verification():
    hashed = hash_password("test password")
    assert verify_password("test password", hashed)
    assert not verify_password("incorrect", hashed)
