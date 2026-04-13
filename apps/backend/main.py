from fastapi import FastAPI
app = FastAPI(title="Bloomora Backend")

@app.get("/")
async def root():
    return {"message": "Bloomora Backend LIVE!"}

@app.get("/docs")
async def docs():
    return {"docs": "http://127.0.0.1:8000/docs"}