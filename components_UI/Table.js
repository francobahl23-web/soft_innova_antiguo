'use client'
import {useEffect, useRef, useState} from 'react'
import Select from './Select'
import Input from './Input'

// Export elements
import {PiMicrosoftExcelLogoFill} from 'react-icons/pi'
import {RiArrowDownDoubleLine} from "react-icons/ri";
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';
import Loader from './Loader'

const defaultColumn = [{id: 'id1', text:'column'}, {id: 'id2', text:'column'}, {id: 'id3', text:'column'}]
const defaultRows= [
    {id1: 'valor1', id2:'valor2', id3:'valor3'},
    {id1: 'valor2', id2:'valor2', id3:'valor3'},
    {id1: 'valor3', id2:'valor2', id3:'valor3'},
    {id1: 'valor4', id2:'valor2', id3:'valor3'},
    {id1: 'valor5', id2:'valor2', id3:'valor3'},
    {id1: 'valor6', id2:'valor2', id3:'valor3'},
    {id1: 'valor7', id2:'valor2', id3:'valor3'}
]

const Table = ({
    columns = defaultColumn,
    rows = defaultRows,
    customfilters = null,
    exportData = null,
    exportTitle = 'Exportable Tabla',
    contextMenu = null,
    setContextMenu = null,
    onClick = null,
    noFiltro = false,
    totalPages = null,
    realPage = null,
    changePage = null,
    realSize = null,
    changeSize = null,
    filtro = null,
    setFiltro = null,
    filtroPlaceholder = 'Filtro',
    loading = null
}) => {
    const [pagination, setPagination] = useState({
        pages: totalPages ? totalPages : 1,
        actual: realPage ? realPage : 0,
        size: realSize ? realSize : {id: 1, value: 5}
    })
    const [globalFilter, setGlobalFilter] = useState('')
    const [filter, setFilter] = useState({})
    const [openFilters, setOpenFilters] = useState(false)
    const [filteredRows, setFilteredRows] = useState([])
    const [selectedRow, setSelectedRow] = useState(null)
    const [exportando, setExportando] = useState(false)
    const [startX, setStartX] = useState(null)
    const tableRef = useRef(null)

    const handleStart = (e) => {
        setStartX(e.pageX || e.touches[0].pageX)
    }

    const handleMove = (e) => {
        if (startX !== null) {
            const currentX = e.pageX || e.touches[0].pageX;
            const deltaX = startX - currentX;

            if(deltaX > 1)
                tableRef.current.scrollLeft += 10
            else if(deltaX < -1)
                tableRef.current.scrollLeft -= 10

            setStartX(currentX);
        }
    }

    const handleEnd = () => {
        setStartX(null)
    }

    const handleExport = async () => {
        try {
            setExportando(true)

            let dataToExport

            if(exportData)
                dataToExport = await exportData(rows)
            else
                dataToExport = filteredRows.length > 0 ? filteredRows : rows

            const workbook = new ExcelJS.Workbook();

            // Crear una hoja de trabajo y agregar datos
            const worksheet = workbook.addWorksheet('Data');

            let headers = []
            Object.keys(dataToExport[0]).filter(
                _header => _header !== 'createdAt' && _header !== 'accion' && _header !== 'updatedAt' && _header !== 'active' && _header !== 'addedBy' && _header.toLowerCase() !== ('id')
            ).forEach(key => {
                let newKey = key[0].toUpperCase() + key.slice(1)
                if(typeof dataToExport[0][key] !== 'object' || dataToExport[0][key] === null)
                    headers.push({header:  newKey, key: key})
            })

            headers.forEach((header, columnIndex) => {
                let column = worksheet.getColumn(columnIndex + 1)
                let cell = worksheet.getCell(1, columnIndex + 1)
                column.header = header.header;
                column.key = header.key;

                // Calcular el ancho óptimo basado en la longitud del texto
                const maxLength = Math.max(
                    ...dataToExport.map((row) => row[header.key] ? row[header.key].toString().length : 0),
                    header.key.toString().length
                );

                column.width = maxLength !== 0 ? maxLength + 3 : header.key.toString().length + 3
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF3C8DBC' }, // Color azul
                };
            });

            dataToExport.forEach((row) => {
                worksheet.addRow(row);
            });

            // Generar un archivo XLSX a partir del libro de trabajo
            const buffer = await workbook.xlsx.writeBuffer();

            // Convertir el búfer en un objeto Blob
            saveAs(new Blob([buffer]), exportTitle + '.xlsx');

            setExportando(false)
        } catch (error) {
            console.log(error);
            setExportando(false)
        }
    }

    const nextPage = () => {
        let aux = {...pagination}
        if(pagination.pages)
        {
            if(pagination.actual + 1 < pagination.pages)
            {
                aux.actual = aux.actual + 1
                if(changePage)
                    changePage(aux.actual)
                else
                    setPagination(aux)
            }
        }
    }

    const prevPage = () => {
        let aux = {...pagination}
        if(pagination.actual >= 1)
        {
            aux.actual--
            if(changePage)
                changePage(aux.actual)
            else
                setPagination(aux)
        }
    }


    const goToPage = (i) => {
        let aux = {...pagination}
        if(i >= 0 && i < pagination.pages) {
            aux.actual = i
            if(changePage)
                changePage(aux.actual)
            else
                setPagination(aux)
        }
    }

    const handleContextMenu = (e, rowData) => {
        if(setContextMenu)
        {
            e.preventDefault()
            setContextMenu({x: e.clientX, y: e.clientY, rowData})
            setSelectedRow(rowData)
        }
    }
    const handleClick = (e, rowData) => {
        e.preventDefault()
        if(onClick)
            onClick({x: e.clientX, y: e.clientY, rowData})
    }

    useEffect(() => {
        setPagination({
            ...pagination,
            actual: realPage
        })
    }, [realPage])

    useEffect(() => {
        setPagination({
            ...pagination,
            size: realSize
        })
    }, [realSize])

    useEffect(() => {
        setPagination({
            ...pagination,
            pages: totalPages
        })
    }, [totalPages])
    
    useEffect(() => {
        if(filtro === null)
        {
            let _rows = [...rows]
            let filterKeys = Object.keys(filter)
    
            if (filterKeys.length > 0) {
                filterKeys.map((key) => {
                    _rows = _rows.filter((_row) => {
                        let add = customfilters[key].checker(_row, filter)
                        return add
                    })
                })
            }
    
            if(globalFilter && globalFilter !== '')
            {
                _rows = _rows.filter((val) => {
                    let add = false
                    for(const column of columns)
                    {
                        if(val[column.id] && typeof val[column.id] !== "object" && String(val[column.id]).toLowerCase().includes(globalFilter.toLowerCase()))
                        {
                            add = true
                            break;
                        }
                    }
                    return add
                })
            }
    
            setFilteredRows(_rows)
        }
        else
            setFilteredRows([...rows])
    },[globalFilter, filter])

    useEffect(() => {
        let pages = totalPages ? totalPages : (Object.keys(filter).length > 0 || globalFilter !== '' ? filteredRows.length : rows.length) > pagination.size.value ?
            Math.ceil((Object.keys(filter).length > 0 || globalFilter !== '' ? filteredRows.length : rows.length) / pagination.size.value)
            :
            1

        if(pagination.actual > pages)
            setPagination({
                ...pagination,
                actual: 0,
                pages: pages
            })
        else
            setPagination({
                ...pagination,
                pages: pages
            })
    },[pagination.size, filteredRows, rows])

    useEffect(() => {
        if(!contextMenu)
            setSelectedRow(null)
    }, [contextMenu])

    return (
        <>
            {
                exportando?
                    <div className='u-1/1 u-flex-center-center'>
                        <Loader text="Generando exportable.."/>
                    </div>
                    :
                    <div className={`u-1/1 u-m3--bottom ${!noFiltro ? 'u-flex-center-space-between' : 'u-flex-end-center'} u-flex-column-center-start@tablet`}>
                        <Select
                            className={'u-1/12 u-m2--vertical'}
                            options={ [ {id: 1, value: 5}, {id: 2, value: 10}, {id: 3, value: 15}, {id: 4, value: 20} ] }
                            defaultOption={typeof pagination.size === 'object' ? pagination.size : {value: pagination.size} }
                            handleChange={
                                (newOption) => {
                                    if(changeSize)
                                        changeSize(newOption.value)
                                    else
                                        setPagination({ ...pagination, size: newOption })}
                                }
                        />
                        {
                            !noFiltro &&   
                            <div className='u-flex-end-center u-flex-start-center@tablet u-1/1 u-cursor'>
                                <Input className={'u-3/12 u-4/12@desktop u-7/12@tablet u-8/12@mobile'} defaultValue={filtro ? filtro : globalFilter} handleChange={(val) => {if(setFiltro) {setFiltro(val)} else {setGlobalFilter(val)}}} placeholder={filtroPlaceholder}/>
                                {
                                    typeof exportData === 'boolean' && exportData &&
                                    <PiMicrosoftExcelLogoFill className='u-m2--left u-color--green u-text--2' onClick={handleExport}/>
                                }
                            </div>
                        }
                    </div>
            }
            {
                customfilters &&
                <div className={`c-table__filter ${openFilters ? 'c-table__filter--open' : ''}`}>
                    <div className='c-table__filter--header'>
                        <p>Filtros</p>
                        <RiArrowDownDoubleLine className='u-cursor' onClick={ () => setOpenFilters((prevState) => !prevState) }/>
                    </div>
                    <div className={`c-table__filter--body ${openFilters ? 'c-table__filter--open' : ''}`}>
                        {
                            Object.keys(customfilters).map((_key) => {
                                let element = customfilters[_key]
                                return <element.component filter={filter} setFilter={setFilter} close={ () => setOpenFilters((prevState) => !prevState) }/>
                            })
                        }
                    </div>
                </div>
            }
            {
                <table 
                    className='c-table'
                    ref={tableRef} 
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd} 
                >
                    <TableHeader columns={ columns } tableRef={tableRef}/>
                    {
                        handleClick ?
                            <TableBody rows={Object.keys(filter).length > 0 || globalFilter !== '' ? filteredRows : rows && rows.length ? rows : []}
                                    columns={columns} pagination={pagination} handleContextMenu={handleContextMenu}
                                    handleClick={handleClick} tableRef={tableRef} selectedRow={selectedRow}
                            />
                        :
                            <TableBody
                                rows={Object.keys(filter).length > 0 || globalFilter !== '' ? filteredRows : rows && rows.length ? rows : []}
                                columns={columns} pagination={pagination} tableRef={tableRef} handleContextMenu={handleContextMenu}
                            />
                    }
                </table>
            }
            {
                exportando?
                    <></>
                :
                    <div className='u-1/1 u-flex-column-center-end'>
                        <Paginado
                            pagination={pagination}
                            next={ nextPage }
                            prev={ prevPage }
                            goToPage={goToPage}
                        />
                        <p>Pagina {pagination.actual + 1} de {pagination.pages}</p>
                    </div>
            }
        </>
    )
}

const Paginado = ({ pagination, next, prev, goToPage = null }) => {
    const pageSelector = () => {
        let selectors = []

        let start = pagination.actual - 2
        if(start < 0)
        {
            start = 0
        }

        for(let i = 0; i < 5 && i + start < pagination.pages; i++)
        {
            selectors.push(
                <button
                    key={i}
                    className={pagination.actual === i + start ? 'c-table__button active u-p1--vertical u-p2--horizontal' : 'c-table__button u-p1--vertical u-p2--horizontal'}
                    id={i}
                    onClick={e => goToPage(i + start)}
                >
                    {i + start + 1}
                </button>
            )
        }

        return selectors
    }

    return (
        <div className='c-table__paginado'>
            <button className='c-table__button u-p1--vertical u-p2--horizontal' onClick={prev}>{'<'}</button>
            <button className='c-table__button u-p1--vertical u-p2--horizontal' onClick={() => goToPage(0)}>{'<<'}</button>
            {pageSelector()}
            <button className='c-table__button u-p1--vertical u-p2--horizontal' onClick={() => goToPage(pagination.pages - 1)}>{'>>'}</button>
            <button className='c-table__button u-p1--vertical u-p2--horizontal' onClick={next}>{'>'}</button>
        </div>
    )
}

const TableHeader = ({ columns, tableRef }) => {
    let ancho = parseInt(tableRef.current?.offsetWidth / columns.length) - 24 - 48
    return (
        <thead>
            <tr className='c-table__thead c-table__th'>
                {
                    columns.map((value, index) => {
                        return (
                            <td
                                className='c-table__td'
                                key={index}
                                style={
                                    {
                                        minWidth: `max(${ancho}px, 125px)`,
                                        maxWidth: `max(${ancho}px, 125px)`,
                                    }
                                }
                            >
                                {value.text}
                            </td>
                        )
                    })
                }
            </tr>
        </thead>
    )
}

const TableBody = ({ rows, columns, pagination, handleContextMenu, handleClick, tableRef, selectedRow }) => {
    let ancho = parseInt(tableRef?.current?.offsetWidth / columns.length) - 24 - 48
    let size = typeof pagination.size === 'object' ? pagination.size.value : pagination.size 
    let start = size * pagination.actual >= rows.length ? 0 : size * pagination.actual

    return (
        <tbody>
        {
            rows.map((value, index) => {
                if (value && index >= start && index < size + start) {
                    let row = <tr
                        className={`c-table__tr ${selectedRow === value ? 'c-table__tr--selected' : ''}`}
                        key={index}
                        onContextMenu={handleContextMenu ? (e) => handleContextMenu(e, value) : null}
                        onClick={handleClick ? (e) => handleClick(e, value) : null}
                        >
                            {
                                columns.map((element, index) => {
                                    let style = element.setStyle ? {...element.setStyle(value)} : {};
                                    style.minWidth = `max(${ancho}px, 200px)`;
                                    style.maxWidth = `max(${ancho}px, 200px)`;
                                    return (
                                        <td
                                            className='c-table__td'
                                            style={style}
                                            key={index}
                                        >
                                            {
                                                value[element.id] === null || value[element.id] === '' ? '-' : value[element.id]
                                            }
                                        </td>
                                    )
                                })
                            }
                        </tr>
                        return row
                    }
                    else
                        return null;
                })
            }
        </tbody>
    )
}


export default Table