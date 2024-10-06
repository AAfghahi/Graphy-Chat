const Excel = require('exceljs');

export const ExcelSheetCreator = async(answerLog) => {
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')
    worksheet.columns = [
        {header: 'Question', key: 'question', width: 30},
        {header: 'Model', key:'LLM', width: 15},
        {header: 'Answer', key: 'conclusion', width: 100},
        {header:"Vector Catalog", key: 'vectorCatalogs', width: 15}
    ]
    worksheet.views = [
        {state: 'frozen', xSplit: 0, ySplit: 1}
    ]
    answerLog.map((answer)=> {
        worksheet.addRow(
            {question: answer.question, LLM: answer.LLM, conclusion: answer.conclusion, vectorCatalogs: answer.vectorCatalogs}
        )
    })
    worksheet.getColumn('conclusion').alignment = {wrapText: true}
    worksheet.getColumn('question').alignment = {vertical:'middle'}
    worksheet.getColumn('LLM').alignment = {vertical:'middle'}
    worksheet.getColumn('vectorCatalogs').alignment = {vertical:'middle'}

    const row = worksheet.getRow(1)
    row.fill = {
        type: 'pattern',
        pattern:'solid',
        fgColor:{argb:'F08080'}
    }
    let buffer = await workbook.xlsx.writeBuffer()
    return buffer
}