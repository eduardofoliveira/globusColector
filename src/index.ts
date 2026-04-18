import "dotenv/config"
import axios from "axios"
import { startOfWeek, endOfWeek, subWeeks, addWeeks, format } from 'date-fns'

import DbOracle from "./database/connectionManager.js"

const syncCarrosGlobus = async () => {
  const db = DbOracle.getConnection()

  const data = await db.raw(`
    select
      codigoveic,
      CODIGOTPFROTA,
      placaatualveic,
      prefixoveic,
      condicaoveic,
      CODIGOEMPRESA
    from
      FRT_CADVEICULOS
    order by
      PREFIXOVEIC
  `)

  console.log(data[0])

  // await axios.post("https://login.teleconsult.com.br/api/inbound/globus/carros", {
  //   id_empresa: process.env.ID_EMPRESA,
  //   token: process.env.TOKEN,
  //   data: data.rows
  // })
}

const syncViagensGlobus = async () => {
  const inicio = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  const fim = endOfWeek(addWeeks(new Date(), 0), { weekStartsOn: 1 })

  console.log(`Sincronizando dados de ${format(inicio, 'dd/MM/yyyy HH:mm:ss')} a ${format(fim, 'dd/MM/yyyy HH:mm:ss')}`)

  const db = DbOracle.getConnection()

  const data = await db.raw(`
      select
        to_char(sr.dtsaida, 'yy-mm-dd' ) dt,
        cv.prefixoveic,
        l.codigolinha,
        l.nomelinha,
        fm.codfunc f1cod,
        fm.apelidofunc f1ap,
        fm.nomefunc f1nome,
        to_char(sr.horasaidagaragem, 'yy-mm-dd hh24:mi:ss' ) dti,
        to_char(sr.horarecolhida, 'yy-mm-dd hh24:mi:ss' ) dtf,
        cv.CODIGOTPFROTA cdft
      from
        plt_saidarecolhida sr
      join frt_cadveiculos cv
        on sr.codigoveic = cv.codigoveic
      left Join flp_funcionarios fm
        on sr.codintmot = fm.codintfunc
      left Join flp_funcionarios fc
        on sr.codintcob = fc.codintfunc
      Join bgm_cadlinhas l
        on sr.codintlinha = l.codintlinha		 
      where
        sr.horasaidagaragem between to_date('${format(inicio, 'yyyy-MM-dd HH:mm:ss')}','yyyy-mm-dd hh24:mi:ss') and to_date('${format(fim, 'yyyy-MM-dd HH:mm:ss')}','yyyy-mm-dd hh24:mi:ss') 
      order by
        cdft,
        cv.prefixoveic,
        sr.horasaidagaragem
  `)

  console.log(data)

  process.exit(0)
}

syncCarrosGlobus()
// syncViagensGlobus()