from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from database import init_db, add_video, get_videos, get_video_by_id, update_video, delete_video, get_videos_by_topic, get_areas, update_area, delete_area, add_area, get_area_by_id, get_videos_count_by_area
from auth import login_required, admin_required
import os
import secrets

# Gera uma chave secreta segura
def generate_secret_key():
    return secrets.token_hex(32)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', generate_secret_key())

# Configurar CORS para produção
CORS(app)

# Inicializar banco de dados
init_db()

# Mapa de SVGs para cada área
SVG_MAP = {
    'compras': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
    ''',
    'financeiro': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.8-1.38 2.83-3.12 3.16z"/>
        </svg>
    ''',
    'pcp': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
    ''',
    'estoque': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6h-4.18C16.4 4.84 15.3 4 14 4h-4c-1.3 0-2.4.84-2.82 2H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7 0h-4c-.55 0-1-.45-1-1s.45-1 1-1h4c.55 0 1 .45 1 1s-.45 1-1 1zm4 12H6V8h2v2h2V8h6v10z"/>
        </svg>
    ''',
    'vendas': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
            <path d="M21 21H3V3h18v18zm-2-2H5V5h14v14z"/>
        </svg>
    ''',
    'fiscal': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
        </svg>
    ''',
    'rh': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.06 7h-.12a2 2 0 0 0-1.9 1.37l-.86 2.58c1.08.6 1.82 1.73 1.82 3.05v8h3zm-7.5-10.5c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zM9 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7.5 6.5c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zM9 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm5.03 3.81C13.38 16.48 11.47 16 9 16c-2.47 0-4.38.48-5.03 1.31-.14.18-.47.69-.47 1.19V18h11v-.5c0-.5-.33-1.01-.47-1.19z"/>
        </svg>
    ''',
    'ti': '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 3H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6v2H8v2h8v-2h-2v-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H4V5h16v10z"/>
        </svg>
    '''
}

def get_svg_for_topic(topic_id):
    return SVG_MAP.get(topic_id, '''
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
    ''')

@app.context_processor
def inject_areas_and_functions():
    areas = get_areas()
    return dict(
        areas=areas,
        get_svg_for_topic=get_svg_for_topic
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if username == 'admin' and password == '@Lina2205':
            session['user_id'] = 1
            session['username'] = username
            session['is_admin'] = True
            return redirect(url_for('admin'))
        else:
            return render_template('login.html', error='Credenciais inválidas')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
@admin_required
def admin():
    videos = get_videos()
    areas = get_areas()
    # Adicionar contagem de vídeos para cada área
    for area in areas:
        area['video_count'] = get_videos_count_by_area(area['id'])
    return render_template('admin.html', videos=videos, areas=areas)

# API Routes para Vídeos
@app.route('/api/videos', methods=['GET'])
def api_get_videos():
    topic = request.args.get('topic')
    if topic:
        videos = get_videos_by_topic(topic)
    else:
        videos = get_videos()
    return jsonify(videos)

@app.route('/api/videos', methods=['POST'])
@login_required
@admin_required
def api_add_video():
    try:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        drive_url = data.get('drive_url')
        topic = data.get('topic')
        
        if not all([title, drive_url, topic]):
            return jsonify({'error': 'Dados incompletos'}), 400
        
        video_id = add_video(title, description, drive_url, topic)
        return jsonify({'id': video_id, 'message': 'Vídeo adicionado com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/videos/<int:video_id>', methods=['PUT'])
@login_required
@admin_required
def api_update_video(video_id):
    try:
        data = request.get_json()
        update_video(video_id, data)
        return jsonify({'message': 'Vídeo atualizado com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/videos/<int:video_id>', methods=['DELETE'])
@login_required
@admin_required
def api_delete_video(video_id):
    try:
        delete_video(video_id)
        return jsonify({'message': 'Vídeo excluído com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API Routes para Áreas
@app.route('/api/areas', methods=['GET'])
def api_get_areas():
    areas = get_areas()
    # Adicionar contagem de vídeos para cada área
    for area in areas:
        area['video_count'] = get_videos_count_by_area(area['id'])
    return jsonify(areas)

@app.route('/api/areas', methods=['POST'])
@login_required
@admin_required
def api_add_area():
    try:
        data = request.get_json()
        area_id = data.get('id')
        name = data.get('name')
        
        if not all([area_id, name]):
            return jsonify({'error': 'Dados incompletos'}), 400
        
        # Verificar se área já existe
        existing_area = get_area_by_id(area_id)
        if existing_area:
            return jsonify({'error': 'Já existe uma área com este ID'}), 400
        
        add_area(area_id, name)
        return jsonify({'message': 'Área adicionada com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/areas/<string:area_id>', methods=['PUT'])
@login_required
@admin_required
def api_update_area(area_id):
    try:
        data = request.get_json()
        new_area_id = data.get('id')
        name = data.get('name')
        
        if not all([new_area_id, name]):
            return jsonify({'error': 'Dados incompletos'}), 400
        
        # Verificar se o novo ID já existe (se for diferente)
        if area_id != new_area_id:
            existing_area = get_area_by_id(new_area_id)
            if existing_area:
                return jsonify({'error': 'Já existe uma área com este ID'}), 400
        
        update_area(area_id, new_area_id, name)
        return jsonify({'message': 'Área atualizada com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/areas/<string:area_id>', methods=['DELETE'])
@login_required
@admin_required
def api_delete_area(area_id):
    try:
        success, message = delete_area(area_id)
        if success:
            return jsonify({'message': message})
        else:
            return jsonify({'error': message}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check para Vercel
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'database': 'initialized'})

# Handler para erros 404
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Página não encontrada'}), 404

# Handler para erros 500
@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Erro interno do servidor'}), 500

# Esta linha é importante para o Vercel
app = app