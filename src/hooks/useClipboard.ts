
import { useState, useEffect } from 'react';
import { ClipboardService } from '../lib/clipboardService';
//import { useUserContext } from '@/lib/UserContextProvider';
//import { useBookContext } from '@/lib/BookContextProvider';
import { toast } from './use-toast';

export const useClipboard = () => {
  const [canCopy, setCanCopy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  //const { userId } = useUserContext();
  //const { state: bookState } = useBookContext();

  const userId = '12345'; // Replace with actual user ID from context or props


  const bookState = {
    bookId: '67890', // Replace with actual book ID from context or props     
    bookDetails: {
      authorId: '12345', // Replace with actual author ID from context or props
      collaborators: [
        { user_id: '12345', collaborator_type: 'AUTHOR' },
        { user_id: '67890', collaborator_type: 'EDITOR' }
      ]
    } // Replace with actual book details from context or props
  };  

  // Listen for clipboard blocked events
  useEffect(() => {
    const handleClipboardBlocked = (event: CustomEvent) => {
      const { message, role } = event.detail;
      console.log(`Clipboard access blocked: ${message}`);
      
      // Show toast notification
      toast({
        title: "Copy Blocked",
        description: message,
        variant: "destructive",
      });
    };

    window.addEventListener('clipboardBlocked', handleClipboardBlocked as EventListener);
    
    return () => {
      window.removeEventListener('clipboardBlocked', handleClipboardBlocked as EventListener);
    };
  }, []);

  // Update user role when book context changes
  useEffect(() => {
    const updateUserRole = async () => {
      if (userId && bookState?.bookId && bookState.bookDetails) {
        // Find the current user's role for this book
        console.log('useClipboard: Updating user role for book', {
          userId,
          bookId: bookState.bookId,
          bookDetails: bookState.bookDetails
        });

        let currentUserCollaborator = null;
        let role = 'VIEWER'; // Default role

        if (bookState.bookDetails?.authorId) {
          // If the book has an author, check if the user is the author
          if (bookState.bookDetails.authorId === userId) {
            role = 'AUTHOR';        
          }
        }
        

        if (!role && bookState.bookDetails?.collaborators) {
          currentUserCollaborator = bookState.bookDetails?.collaborators.find(
            (collab: any) => collab.user_id === userId
          );
          
          role = currentUserCollaborator?.collaborator_type || 'VIEWER';
        }

        console.log('useClipboard: Current user role determined:', role);
        
        try {
          // Store role locally for web environment
          const roleData = {
            user_id: userId,
            book_id: bookState.bookId,
            role: role
          };
          localStorage.setItem('current_user_role', JSON.stringify(roleData));
          
          // Also set in Tauri if available
          await ClipboardService.setUserRole(userId, bookState.bookId, role);
          
          const canAccess = await ClipboardService.canAccessClipboard();
          setCanCopy(canAccess);
          console.log('Clipboard access updated:', { userId, bookId: bookState.bookId, role, canAccess });
        } catch (error) {
          console.error('Failed to update clipboard permissions:', error);
          setCanCopy(false);
        }
      } else {
        // No role data available, deny access
        setCanCopy(false);
        localStorage.removeItem('current_user_role');
      }
    };

    updateUserRole();
  }, [userId, bookState.bookId, bookState.bookDetails]);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('useClipboard: copyToClipboard called');
      const success = await ClipboardService.copyToClipboard(text);
      console.log('useClipboard: Copy operation result:', success);
      
      if (!success) {
        // Show blocked message if copy failed due to role restrictions
        toast({
          title: "Copy Blocked",
          description: "Your role for this book does not have clipboard access.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Copy operation failed:', error);
      toast({
        title: "Copy Failed",
        description: "An error occurred while copying to clipboard.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    copyToClipboard,
    canCopy,
    isLoading,
  };
};
