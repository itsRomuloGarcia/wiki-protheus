import sqlite3
import os
from datetime import datetime

# Caminho do banco de dados
_db_path = 'protheus_wiki.db'

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tabela de vídeos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            drive_url TEXT NOT NULL,
            topic TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabela de áreas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS areas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Inserir áreas padrão se a tabela estiver vazia
    cursor.execute('SELECT COUNT(*) FROM areas')
    if cursor.fetchone()[0] == 0:
        default_areas = [
            ('compras', 'Compras'),
            ('financeiro', 'Financeiro'),
            ('pcp', 'PCP'),
            ('estoque', 'Estoque'),
            ('vendas', 'Vendas'),
            ('fiscal', 'Fiscal'),
            ('rh', 'Recursos Humanos'),
            ('ti', 'T.I. Protheus')
        ]
        
        for area_id, name in default_areas:
            cursor.execute('INSERT OR IGNORE INTO areas (id, name) VALUES (?, ?)', 
                          (area_id, name))
    
    # Inserir alguns vídeos de exemplo se a tabela estiver vazia
    cursor.execute('SELECT COUNT(*) FROM videos')
    if cursor.fetchone()[0] == 0:
        sample_videos = [
            ('Configuração Inicial do Protheus', 'Primeiros passos para configurar o ambiente', 'https://drive.google.com/file/d/1abc123/preview', 'ti'),
            ('Lançamento de Nota Fiscal', 'Como fazer lançamento de nota fiscal', 'https://drive.google.com/file/d/2def456/preview', 'fiscal'),
            ('Controle de Estoque', 'Gerenciamento de estoque no Protheus', 'https://drive.google.com/file/d/3ghi789/preview', 'estoque')
        ]
        
        for title, description, drive_url, topic in sample_videos:
            cursor.execute('''
                INSERT INTO videos (title, description, drive_url, topic, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (title, description, drive_url, topic, datetime.now(), datetime.now()))
    
    conn.commit()
    conn.close()

def get_connection():
    conn = sqlite3.connect(_db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_areas():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM areas ORDER BY name')
    areas = cursor.fetchall()
    conn.close()
    return [dict(area) for area in areas]

def get_area_by_id(area_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM areas WHERE id = ?', (area_id,))
    area = cursor.fetchone()
    conn.close()
    return dict(area) if area else None

def add_area(area_id, name):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO areas (id, name) VALUES (?, ?)', (area_id, name))
    conn.commit()
    conn.close()

def update_area(old_area_id, new_area_id, name):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Se o ID mudou, precisamos atualizar todos os vídeos relacionados
    if old_area_id != new_area_id:
        cursor.execute('UPDATE videos SET topic = ? WHERE topic = ?', (new_area_id, old_area_id))
    
    cursor.execute('UPDATE areas SET id = ?, name = ? WHERE id = ?', (new_area_id, name, old_area_id))
    conn.commit()
    conn.close()

def delete_area(area_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verificar se existem vídeos associados a esta área
    cursor.execute('SELECT COUNT(*) FROM videos WHERE topic = ?', (area_id,))
    video_count = cursor.fetchone()[0]
    
    if video_count > 0:
        conn.close()
        return False, f'Não é possível excluir a área "{area_id}" porque existem {video_count} vídeo(s) associado(s).'
    
    cursor.execute('DELETE FROM areas WHERE id = ?', (area_id,))
    conn.commit()
    conn.close()
    return True, 'Área excluída com sucesso'

def get_videos_count_by_area(area_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM videos WHERE topic = ?', (area_id,))
    count = cursor.fetchone()[0]
    conn.close()
    return count

def add_video(title, description, drive_url, topic):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO videos (title, description, drive_url, topic, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (title, description, drive_url, topic, datetime.now(), datetime.now()))
    video_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return video_id

def get_videos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM videos ORDER BY created_at DESC')
    videos = cursor.fetchall()
    conn.close()
    return [dict(video) for video in videos]

def get_video_by_id(video_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM videos WHERE id = ?', (video_id,))
    video = cursor.fetchone()
    conn.close()
    return dict(video) if video else None

def get_videos_by_topic(topic):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM videos WHERE topic = ? ORDER BY created_at DESC', (topic,))
    videos = cursor.fetchall()
    conn.close()
    return [dict(video) for video in videos]

def update_video(video_id, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE videos 
        SET title = ?, description = ?, drive_url = ?, topic = ?, updated_at = ?
        WHERE id = ?
    ''', (
        data.get('title'), 
        data.get('description'), 
        data.get('drive_url'), 
        data.get('topic'), 
        datetime.now(), 
        video_id
    ))
    conn.commit()
    conn.close()

def delete_video(video_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM videos WHERE id = ?', (video_id,))
    conn.commit()
    conn.close()