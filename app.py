# Importa os módulos necessários do Flask e outras bibliotecas
import os
from dotenv import load_dotenv
from flask import Flask, Response, render_template, request, stream_with_context
load_dotenv()
import google.generativeai as genai  # biblioteca da API do Gemini
import traceback  # para exibir erros detalhados no terminal

# Cria a aplicação Flask
app = Flask(__name__)

# =======================
# CONFIGURAÇÃO DO GEMINI
# =======================

# Chave de API para acessar o modelo do Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configura a biblioteca com a chave de API
genai.configure(api_key=GEMINI_API_KEY)

# Define qual modelo do Gemini será usado
model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
print("✓ Modelo configurado: gemini-2.5-flash-preview-05-20")

# =======================
# CARREGAR BASE DE DADOS
# =======================


def carregar_base_dados():
    """Tenta abrir o arquivo dados_academicos.txt com fallback de encoding."""
    for encoding in ("utf-8", "latin-1", "utf-16"):
        try:
            with open("dados_academicos.txt", "r", encoding=encoding) as f:
                texto_completo = f.read()
            print(f"✓ Base carregada com encoding: {encoding}")
            return texto_completo
        except UnicodeDecodeError:
            continue
        except FileNotFoundError:
            print("⚠ Arquivo 'dados_academicos.txt' não encontrado.")
            return None
    print("❌ Nenhum encoding compatível encontrado para 'dados_academicos.txt'.")
    return None


try:
    texto_completo = carregar_base_dados()
    if texto_completo:
        # Divide o texto em partes separadas por duas quebras de linha
        dados_base = [p.strip()
                      for p in texto_completo.split("\n\n") if p.strip()]

        # Calcula o tamanho total em caracteres
        total = sum(len(p) for p in dados_base)

        # Se o texto for muito grande, corta parte para não estourar limite da API
        if total > 30000:
            print(f"⚠ Base muito grande ({total} chars), reduzindo...")
            nova = []
            atual = 0
            for p in dados_base:
                if atual + len(p) < 30000:
                    nova.append(p)
                    atual += len(p)
                else:
                    break
            dados_base = nova
            print(f"✓ Base reduzida ({atual} chars)")
        else:
            print(f"✓ Base carregada ({total} chars)")
    else:
        dados_base = ["Nenhum dado disponível no momento."]

except Exception as e:
    print("❌ Erro ao carregar base de dados:", traceback.format_exc())
    dados_base = ["Nenhum dado disponível no momento."]

# =======================
# CONFIGURAÇÃO DO PROMPT
# =======================

sistema_prompt = (
    "Você é um assistente acadêmico da UniEVANGÉLICA. "
    "Seja DIRETO e OBJETIVO nas respostas. "
    "Responda em no máximo 4-5 linhas, usando parágrafos simples SEM asteriscos, SEM listas e SEM bullet points. "
    "Use as informações fornecidas para responder. "
    "Se não souber a resposta com base nesses dados, diga apenas "
    "'Poxa, não tenho essa informação disponível!! Mas posso continuar te ajudando com outros assuntos, como seu calendário de aulas ou notas das avaliações'.\n\n"
    f"--- BASE DE DADOS ---\n{' '.join(dados_base)}\n--- FIM DA BASE ---"
)

# Lista que armazena as perguntas e respostas anteriores
historico_chat = []

# =======================
# FUNÇÃO PRINCIPAL DE RESPOSTA
# =======================


def responder_avancado(pergunta):
    """Gera a resposta do chatbot em modo streaming."""
    try:
        print(f"\n📨 Pergunta: {pergunta[:100]}")
        mensagem = f"{sistema_prompt}\n\nPergunta do usuário: {pergunta}"

        if len(mensagem) > 100000:
            yield "Desculpe, a base está muito grande. Contate o administrador."
            return

        # Gera a resposta em streaming
        response = model.generate_content(mensagem, stream=True)

        # Itera sobre os chunks da resposta e envia para o front-end
        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception:
        print("❌ ERRO:", traceback.format_exc())
        yield "Erro ao processar a pergunta."


# =======================
# ROTAS DO SITE
# =======================

@app.route('/')
def login():
    return render_template('login.html')


@app.route('/home')
def home():
    return render_template('home.html')


@app.route('/assistente')
def assistente():
    return render_template('assistente.html')


@app.route('/stream')
def stream():
    pergunta = request.args.get('mensagem', '').strip()
    if not pergunta:
        return Response("Nenhuma pergunta fornecida.", status=400)

    # Usa um gerador para enviar a resposta em partes (streaming)
    def generate():
        for chunk in responder_avancado(pergunta):
            yield f"data: {chunk}\n\n"

    # Retorna a resposta como um evento de stream
    return Response(stream_with_context(generate()), mimetype='text/event-stream')


# =======================
# EXECUÇÃO
# =======================
if __name__ == '__main__':
    app.run(debug=True)
