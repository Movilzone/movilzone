"""Read only the public Hoja 3 sales range; never write to the source Sheet."""
import subprocess,tempfile,urllib.request,os
from pathlib import Path
os.chdir(Path(__file__).resolve().parent.parent)
url='https://docs.google.com/spreadsheets/d/1f3lGWwwwFoHwLLo6GkjhtDSr_aqQLfr7MJiZ9-U59D8/export?format=csv&gid=1161454607&range=A1:H2000'
with urllib.request.urlopen(url,timeout=30) as response:
    if 'csv' not in response.headers.get('Content-Type',''):raise ValueError('Fuente CSV no disponible')
    data=response.read(1000001)
if len(data)>1000000:raise ValueError('Fuente demasiado grande')
with tempfile.NamedTemporaryFile(suffix='.csv') as source:
    source.write(data);source.flush()
    subprocess.run(['node','scripts/convert-catalog.mjs',source.name],check=True)
