import psycopg2


def run(x):
    return x + 1


def test_a():
    assert run(3) == 4


def connect():
    conn = psycopg2.connect(
        host="172.17.0.2",
        database="postgres",
        user="postgres",
        password="Iamalextay96",
        port=5432)
    cur = conn.cursor()

    # execute a statement
    print('PostgreSQL database version:')
    cur.execute('SELECT version()')

    # display the PostgreSQL database server version
    db_version = cur.fetchone()
    print(db_version)
    return db_version


def test_conn():
    assert connect() is not None


if __name__ == "__main__":
    print("hi")
    run(3)
    connect()
