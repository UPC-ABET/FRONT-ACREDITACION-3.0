'use client'

import { PortfolioBreadcrumbs } from './PortfolioBreadcrumbs'

const people = [{ name: 'Prueba', title: '17/04/2023', email: '25 GB' }]
const pages = [
  { name: 'Projects', dir: '' },
  { name: 'Project Nero', dir: '' },
]

/**
 * Vista "Compartido conmigo" migrada como placeholder funcional.
 * El frontend antiguo tampoco tenia logica real aqui (mostraba datos hardcoded).
 */
export function SharedWithMe() {
  return (
    <div className="px-0 mobile:px-6 desktop:px-8 shadow-lg rounded-lg bg-white">
      <div className="px-4 mobile:px-6 desktop:px-8 py-20 pb-20">
        <PortfolioBreadcrumbs pages={pages} />
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nombre
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Ultima modificacion
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Tamano
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {people.map((person) => (
                    <tr key={person.email}>
                      <td className="border-t border-gray-200 px-6 py-4 whitespace-nowrap">
                        {person.name}
                      </td>
                      <td className="border-t border-gray-200 px-6 py-4 whitespace-nowrap">
                        {person.title}
                      </td>
                      <td className="border-t border-gray-200 px-6 py-4 whitespace-nowrap">
                        {person.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedWithMe
