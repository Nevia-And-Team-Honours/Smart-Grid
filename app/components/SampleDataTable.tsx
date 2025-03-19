import React from 'react';

interface SampleDataTableProps {
  data: { [key: string]: string | number }[];
}

const SampleDataTable: React.FC<SampleDataTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No sample data available.</p>;
  }
  
  const columns = Object.keys(data[0]);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 bg-gray-50">
          <tr>
            {columns.map(column => (
              <th key={column} className="px-2 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-white border-b">
              {columns.map(column => (
                <td key={`${rowIndex}-${column}`} className="px-2 py-2">
                  {typeof row[column] === 'number' ? row[column].toFixed(3) : row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SampleDataTable;