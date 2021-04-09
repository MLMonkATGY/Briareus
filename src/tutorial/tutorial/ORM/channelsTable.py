from sqlalchemy.orm import registry
import sqlalchemy as db
from uuid import uuid4
from sqlalchemy.dialects import postgresql
import sqlalchemy


def channelsTable():
    return db.Table('channels', db.MetaData(),
                    db.Column('channel_id',
                              db.String(255), primary_key=True),
                    db.Column('channel_names',
                              db.String(255), nullable=False),
                    db.Column('video_observed', db.Integer,
                              default=0),


                    )
