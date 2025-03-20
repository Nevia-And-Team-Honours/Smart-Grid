import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DatasetSummaryProps {
  datasetInfo: {
    num_rows: number;
    num_columns: number;
    columns: string[];
    class_distribution: { [key: string]: number };
  };
}

const DatasetSummary: React.FC<DatasetSummaryProps> = ({ datasetInfo }) => {
  return (
    <div className="space-y-4 text-black">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded border border-gray-200">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Total Records</p>
          <p className="text-2xl font-mono">{datasetInfo?.num_rows?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded border border-gray-200">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Features</p>
          <p className="text-2xl font-mono">{datasetInfo.num_columns||0 - 2}</p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider">Features</h3>
          <Badge variant="outline" className="text-xs">
            {datasetInfo?.columns?.filter(col => col !== 'stabf' && col !== 'stab').length}
          </Badge>
        </div>
        <ScrollArea className="h-24 rounded border border-gray-200 bg-gray-50">
          <div className="p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {datasetInfo.columns?.filter((col: string) => col !== 'stabf' && col !== 'stab')
                .map((col: string) => (
                  <div key={col} className="text-sm font-mono text-gray-700">{col}</div>
                ))}
            </div>
          </div>
        </ScrollArea>
      </div>
      
      <Separator />
      
      {datasetInfo?.class_distribution && Object.keys(datasetInfo.class_distribution).length > 0 && (
         <div>
         <div className="flex items-center justify-between mb-2">
           <h3 className="text-sm font-medium uppercase tracking-wider">Target Classes</h3>
           <Badge variant="outline" className="text-xs">
             {Object?.keys(datasetInfo.class_distribution).length}
           </Badge>
         </div>
         <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
           {Object.entries(datasetInfo.class_distribution).map(([className, count]: [string, number]) => (
             <div key={className} className="flex justify-between items-center">
               <span className="text-sm font-mono">{className}</span>
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium">{count}</span>
                 <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-black"
                     style={{ 
                       width: `${(count / Object.values(datasetInfo.class_distribution).reduce((a, b) => (a as number) + (b as number), 0) * 100)}%` 
                     }}
                   />
                 </div>
               </div>
             </div>
           ))}
         </div>
           
       </div>
     )}
    </div>
  );
};

export default DatasetSummary;