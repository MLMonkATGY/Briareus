def getConnectionString():
    driver = "postgresql+psycopg2"
    username = "postgres"
    password = "Iamalextay96"
    host = "172.17.0.2"
    port = "5432"
    dbname = "postgres"
    return "{0}://{1}:{2}@{3}:{4}/{5}".format(driver, username, password, host, port, dbname)
