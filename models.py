# Modelos de dados (se necessário para expansão futura)
class Video:
    def __init__(self, id, title, description, drive_url, topic, created_at, updated_at):
        self.id = id
        self.title = title
        self.description = description
        self.drive_url = drive_url
        self.topic = topic
        self.created_at = created_at
        self.updated_at = updated_at