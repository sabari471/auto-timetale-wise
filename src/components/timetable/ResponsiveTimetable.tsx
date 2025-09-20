import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveTimetableProps {
  onRefresh: () => void;
  onForceRegenerate: () => void;
  loading: boolean;
  lastUpdated?: string;
  conflicts?: number;
}

const ResponsiveTimetable: React.FC<ResponsiveTimetableProps> = ({
  onRefresh,
  onForceRegenerate,
  loading,
  lastUpdated,
  conflicts = 0
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceRegenerate = async () => {
    setIsRefreshing(true);
    try {
      await onForceRegenerate();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw
                className={cn(
                  "h-5 w-5 text-blue-600",
                  (loading || isRefreshing) && "animate-spin"
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Responsive Timetable System
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Update and regenerate timetable manually
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Card */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {conflicts === 0 ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {conflicts === 0 ? 'No Conflicts' : `${conflicts} Conflicts`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {conflicts === 0 ? 'Perfect scheduling' : 'Some conflicts detected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated Card */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-xs text-gray-600">
                    {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 mr-2",
                      (loading || isRefreshing) && "animate-spin"
                    )}
                  />
                  Refresh Now
                </Button>

                <Button
                  onClick={handleForceRegenerate}
                  disabled={loading || isRefreshing}
                  size="sm"
                  variant="default"
                  className="w-full"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 mr-2",
                      (loading || isRefreshing) && "animate-spin"
                    )}
                  />
                  Force Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflict Resolution Info */}
        {conflicts > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Scheduling Conflicts Detected</p>
                <p className="text-amber-700">
                  {conflicts} conflicts were found during timetable generation. 
                  The system has automatically resolved them, but you may want to review the schedule for optimal distribution.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveTimetable;
