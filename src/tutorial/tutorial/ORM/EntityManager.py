import sqlalchemy as db

from tutorial.ORM.getConnString import getConnectionString
from tutorial.ORM.channelsTable import channelsTable
ALL_TABLES = [channelsTable()]


class EntityManager():
    __instance = None

    def __init__(self):
        """ Virtually private constructor. """
        resp = self.engine = db.create_engine(
            getConnectionString(), pool_size=20,
            pool_recycle=300, echo=False)
        # print(resp)
        # If table don't exist, Create.
        tb = []
        metadata = db.MetaData()
        for tableSchema in ALL_TABLES:

            if not self.engine.dialect.has_table(self.engine, tableSchema):
                tb.append(tableSchema)
        createdResp = metadata.create_all(self.engine, tables=tb)
        # print(createdResp)
        if EntityManager.__instance is not None:
            raise Exception("This class is a singleton!")
        else:

            EntityManager.__instance = self

    @ staticmethod
    def getInstance():
        """ Static access method. """
        if EntityManager.__instance is None:
            EntityManager()
        return EntityManager.__instance

    def getConnection(self):
        connection = self.engine.connect()
        return connection
