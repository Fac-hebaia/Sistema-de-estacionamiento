import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/", async(req, res) => {
    try {
        const obtenerUsuarios = await prisma.usuario.findMany();
        if (obtenerUsuarios.length === 0) {return res.status(404).json("Usuario no encontrado")}
        res.json(obtenerUsuarios)
    }
    catch (error) {
        res.status(500).json("Hubo un error en el servidor")
    }
})

app.get("/usuarios", async (req, res) => {
    try {
        const buscarUsuario = await prisma.auto.findMany({where: {activo: true}, include: {usuario: true}});
        if(buscarUsuario.length === 0) {return res.status(404).json("Usuario no encontrado")}
        res.json(buscarUsuario)}
    catch(error) {
        res.status(500).json("Hubo una falla en el servidor")
    }
})
app.get("/autos/:patente", async (req, res) => {
    try{
        const buscarPatente = await prisma.auto.findUnique({where: {patente: String(req.params.patente)}, include: {usuario:true}});
        if (!buscarPatente) {return res.status(404).json("Patente no encontrada")};
        res.status(200).json(buscarPatente)
    }
    catch(error) {
        res.status(500).json("Error en el servidor")
    }
})


app.post("/usuarios", async (req, res) => {
    const {modeloAuto, patente} = req.body;
    if (!modeloAuto || !patente) {return res.status(400).json("Falta completar campos obligatorios")}
    try {
        const buscarAuto = await prisma.auto.findUnique({where: {patente: patente}});
        if (buscarAuto) {return res.status(409).json("Auto ya registrado en la base de datos")};
        const registro = await prisma.usuario.create({data: {fechaRegistro: new Date(), auto: {create: {modelo: modeloAuto, patente: patente}} }});
        res.status(201).json({mensaje: "Auto registrado!", usuario: registro})
    }
    catch (error) {
        res.status(500).json("Error en el servidor")
    }
})

app.patch("/usuarios/:id", async (req, res) => {

    const noEsNumero = isNaN(req.params.id);
    if (noEsNumero) {return res.status(400).json({error:"Error, se espera un numero"})};
    
    try { const buscarActualizar = await prisma.usuario.findUnique({where: {id: Number(req.params.id)}});
    if (!buscarActualizar) {return res.status(404).json("Usuario no encontrado")};
    const actualizar = await prisma.auto.update({where: {usuarioId: Number(req.params.id)}, data: {activo: false}});
    res.status(200).json({mensaje: "Auto despachado exitosamente", auto: actualizar.usuarioId})}
    catch(error) {
        res.status(500).json("Error en el servidor")
    }
})

app.listen(3000, () => {
    console.log('server iniciado en puerto 3000');
});