import os
import sys
sys.path.insert(0, '.')
import uvicorn
uvicorn.run('app.main:app', host=os.getenv('HOST', '0.0.0.0'), port=int(os.getenv('PORT', '8000')), log_level='info')
