from time import time
from unicodedata import name
import requests
from bs4 import BeautifulSoup

def scraping(url):
    datos = {'url': url, 'title': None, 'description': None, 'keywords': None}
    try:
        r = requests.get(url, timeout=1)
    except Exception:
        return None

    if r.status_code == 200:
        
        # BeautifulSoup
        source = requests.get(url).text
        soup = BeautifulSoup(source, features='html.parser')

        # Se obtienen las etiquetas meta
        meta = soup.find("meta")

        title = soup.find('title')
        description = soup.find("meta", {'name': "description"})
        keywords = soup.find("meta", {'name': "keywords"})
        
        # Limpiamos las Keywords
        try:
            if keywords is None:
                return None
            else:
                keywords = keywords.replace(" ", "") if keywords else None
                keywords = keywords.replace(".", "") if keywords else None

        except Exception:
            return None
        # Guardamos los datos obtenidos
        datos['url'] = url
        datos['title'] = title.get_text()
        datos['description'] = description
        datos['keywords'] = keywords 

        if datos['keywords'] is None:
                return None
        return datos
          
    return None

# Creamos el archivo para iniciar la base de datos
with open('init.sql', 'w') as db:
    db.write('CREATE TABLE URLs(Id INT, Title VARCHAR(300), Description VARCHAR(1000), Keywords VARCHAR(1000), URL VARCHAR(200));')
    db.writelines('\n')

# Leemos los datos
cont = 1
with open('../../user-ct-test-collection-05.txt', 'r') as f:
    lines = f.readlines()[1:]
    for line in lines:
        if (cont == 500): #Limitante a 500 datos correctos
            break
        tab = line.split('\t')
        
        # Evitamos las url en blanco. Es \n porque es el último término antes de un salto de linea
        if tab[4] == '\n' or tab[4] ==None:
            continue
        url = tab[4]
        # Evitamos el salto de linea
        c_url = url[:-1]

        # Scraping
        datos = scraping(c_url)
        
        if datos is not None:
            # Guardamos los datos en el .sql   
            with open('init.sql', 'a+') as db:
                db.write('INSERT INTO URLs(Id, Title, Description, Keywords, URL) VALUES (' + repr(cont) + ','+ repr(datos['title']) +','+ repr(datos['description']) +','+ repr(datos['keywords']) +','+ repr(datos['url']) +');')
                db.writelines('\n')
            #print(datos['description'])
            print(f'[{cont}] URL: {datos["url"]}\n Title: {repr(datos["title"])}\n Description: {repr(datos["description"])}\n Keywords: {repr(datos["keywords"])}')
            cont += 1
db.close()