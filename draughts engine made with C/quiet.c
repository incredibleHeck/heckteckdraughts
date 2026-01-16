#include <stdio.h>
#include "var.h"

int quiet_crown(int p,int color)
{
    int d,pp,eneman,enecrown;

    eneman=man|!color;enecrown=crown|!color;

    for(d=0;d<4;d++) {
        pp=p;
        do pp=next[color][pp][d]; while(board[pp]==empty);
        if (board[pp]==eneman || board[pp]==enecrown) if (board[next[color][pp][d]]==empty) return(false);
    }
    return(true);
}

int wnc_quiet()
{
    int ip,p;

    for(ip=5;ip<50;ip++) {
        p=map[ip];
        if (board[p] == (white|man)) {
            if (board[p-7]==(black|man)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(black|man)) if (board[p-12]==empty) return(false);
            if (board[p+7]==(black|man)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(black|man)) if (board[p+12]==empty) return(false);
        }
    }
    nquietfail++;
    return(true);
}

int w_quiet()
{
    int ip,p,d,pp;

    if (pieces[white|crown]==0 && pieces[black|crown]==0) return(wnc_quiet());
    for(ip=0;ip!=50;ip++) {
        p=map[ip];
        if (board[p] == (white|man)) {
            if (board[p-7]==(black|man) || board[p-7]==(black|crown)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(black|man) || board[p-6]==(black|crown)) if (board[p-12]==empty) return(false);
            if (board[p+7]==(black|man) || board[p+7]==(black|crown)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(black|man) || board[p+6]==(black|crown)) if (board[p+12]==empty) return(false);
        }
        else if (board[p] ==(white|crown)) {
            for(d=0;d<4;d++) {
                pp=p;
                do pp=next[white][pp][d]; while(board[pp]==empty);
                if (board[pp]==(black|man) || board[pp]==(black|crown)) if (board[next[white][pp][d]]==empty) return(false);
            }
        }
    }
    nquietfail++;
    return(true);
}

int bnc_quiet()
{
    int ip,p;

    for(ip=44;ip>=0;ip--) {
        p=map[ip];
        if (board[p] == (black|man)) {
            if (board[p+7]==(white|man)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(white|man)) if (board[p+12]==empty) return(false);
            if (board[p-7]==(white|man)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(white|man)) if (board[p-12]==empty) return(false);
        }
    }
    nquietfail++;
    return(true);
}


int b_quiet()
{
    int ip,p,d,pp;

    if (pieces[white|crown]==0 && pieces[black|crown]==0) return(bnc_quiet());
    for(ip=49;ip>=0;ip--) {
        p=map[ip];
        if (board[p] == (black|man)) {
            if (board[p+7]==(white|man) || board[p+7]==(white|crown)) if (board[p+14]==empty) return(false);
            if (board[p+6]==(white|man) || board[p+6]==(white|crown)) if (board[p+12]==empty) return(false);
            if (board[p-7]==(white|man) || board[p-7]==(white|crown)) if (board[p-14]==empty) return(false);
            if (board[p-6]==(white|man) || board[p-6]==(white|crown)) if (board[p-12]==empty) return(false);
        }
        else if (board[p] ==(black|crown)) {
            for(d=0;d<4;d++) {
                pp=p;
                do pp=next[black][pp][d]; while(board[pp]==empty);
                if (board[pp]==(white|man) || board[pp]==(white|crown)) if (board[next[black][pp][d]]==empty) return(false);
            }
        }
    }
    nquietfail++;
    return(true);
}

int quiet(int color)
/* returns false if color can capture, true otherwise */
{
    nquiet++;
    if (color==white) return(w_quiet());
    else return(b_quiet());
    printf("fatal: q\n");
    return(false);
}


