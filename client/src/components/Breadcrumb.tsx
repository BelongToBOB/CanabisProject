import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Map route segments to readable names
  const routeNameMap: Record<string, string> = {
    users: 'ผู้ใช้งาน',
    batches: 'สินค้าคงคลัง',
    'sales-orders': 'คำสั่งขาย',
    create: 'สร้าง',
    reports: 'รายงาน',
    inventory: 'รายงานสต็อก',
    'monthly-profit': 'กำไรรายเดือน',
    'profit-shares': 'การแบ่งกำไร',
  };

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <Link
        to="/"
        className={cn(
          'flex items-center hover:text-foreground transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring rounded-sm'
        )}
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        
        // Check if segment is a number (likely an ID)
        const isId = /^\d+$/.test(segment);
        const displayName = isId ? `#${segment}` : (routeNameMap[segment] || segment);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="font-medium text-foreground">{displayName}</span>
            ) : (
              <Link
                to={routeTo}
                className={cn(
                  'hover:text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-ring rounded-sm'
                )}
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
