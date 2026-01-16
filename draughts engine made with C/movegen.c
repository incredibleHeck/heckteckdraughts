/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

#include "var.h"
#include <stdio.h>

/* movegen globals */
int capture;
int Indx;
int mg_level;
int mg_color;
int mg_eneman;
int mg_enecrown;
int mg_owncrown;
int mg_ownman;

char capture_path[48];

void mancapture(int p,int depth,int d)
{
    int cap=false;
    int dir,np,nnp;

    for(dir=0;dir<4;dir++) if (dir!=(d^2)) {
            np=next[mg_color][p][dir];
            if (board[np]==mg_eneman || board[np]==mg_enecrown) {
                nnp=next[mg_color][np][dir];
                if (board[nnp]==empty) {
                    cap=true;
                    capture_path[depth]=np;
                    capture_path[depth+1]=board[np];
                    capture_path[depth+2]=nnp;
                    board[np]|=taken;
                    mancapture(nnp,depth+3,dir);
                    board[np]-=taken;
                }
            }
        }

    if (cap==false && depth>3) { /* at least one capture */
        int i;

        if (depth>capture) {capture=depth; Indx=0;}
        if (depth>=capture) {
            for(i=1;i<depth;i++) movelist[mg_level][Indx][i]=capture_path[i];
            movelist[mg_level][Indx][depth]=promote[mg_color][capture_path[depth-1]];
            movelist[mg_level][Indx][0]=depth;
            Indx++;
        }
    }
}

void mancapture_wnc(int p,int depth)
{
    int cap=false;

    if (board[p-7]==(black|man)) {
        if (board[p-14]==empty) {
            cap=true;
            capture_path[depth]=p-7;
            capture_path[depth+1]=black|man;
            capture_path[depth+2]=p-14;
            board[p-7]|=taken;
            mancapture_wnc(p-14,depth+3);
            board[p-7]-=taken;
        }
    }
    if (board[p-6]==(black|man)) {
        if (board[p-12]==empty) {
            cap=true;
            capture_path[depth]=p-6;
            capture_path[depth+1]=black|man;
            capture_path[depth+2]=p-12;
            board[p-6]|=taken;
            mancapture_wnc(p-12,depth+3);
            board[p-6]-=taken;
        }
    }
    if (board[p+7]==(black|man)) {
        if (board[p+14]==empty) {
            cap=true;
            capture_path[depth]=p+7;
            capture_path[depth+1]=black|man;
            capture_path[depth+2]=p+14;
            board[p+7]|=taken;
            mancapture_wnc(p+14,depth+3);
            board[p+7]-=taken;
        }
    }
    if (board[p+6]==(black|man)) {
        if (board[p+12]==empty) {
            cap=true;
            capture_path[depth]=p+6;
            capture_path[depth+1]=black|man;
            capture_path[depth+2]=p+12;
            board[p+6]|=taken;
            mancapture_wnc(p+12,depth+3);
            board[p+6]-=taken;
        }
    }
    if (cap==false && depth>3) { /* at least one capture */
        int i;
        if (depth>capture) {capture=depth; Indx=0;}
        if (depth>=capture) {
            for(i=1;i<depth;i++) movelist[mg_level][Indx][i]=capture_path[i];
            movelist[mg_level][Indx][depth]=promote[white][capture_path[depth-1]];
            movelist[mg_level][Indx][0]=depth;
            Indx++;
        }
    }
}

void mancapture_bnc(int p,int depth)
{
    int cap=false;
    if (board[p+7]==(white|man)) {
        if (board[p+14]==empty) {
            cap=true;
            capture_path[depth]=p+7;
            capture_path[depth+1]=white|man;
            capture_path[depth+2]=p+14;
            board[p+7]|=taken;
            mancapture_bnc(p+14,depth+3);
            board[p+7]-=taken;
        }
    }
    if (board[p+6]==(white|man)) {
        if (board[p+12]==empty) {
            cap=true;
            capture_path[depth]=p+6;
            capture_path[depth+1]=white|man;
            capture_path[depth+2]=p+12;
            board[p+6]|=taken;
            mancapture_bnc(p+12,depth+3);
            board[p+6]-=taken;
        }
    }
    if (board[p-7]==(white|man)) {
        if (board[p-14]==empty) {
            cap=true;
            capture_path[depth]=p-7;
            capture_path[depth+1]=white|man;
            capture_path[depth+2]=p-14;
            board[p-7]|=taken;
            mancapture_bnc(p-14,depth+3);
            board[p-7]-=taken;
        }
    }
    if (board[p-6]==(white|man)) {
        if (board[p-12]==empty) {
            cap=true;
            capture_path[depth]=p-6;
            capture_path[depth+1]=white|man;
            capture_path[depth+2]=p-12;
            board[p-6]|=taken;
            mancapture_bnc(p-12,depth+3);
            board[p-6]-=taken;
        }
    }
    if (cap==false && depth>3) { /* at least one capture */
        int i;

        if (depth>capture) {capture=depth; Indx=0;}
        if (depth>=capture) {
            for(i=1;i<depth;i++) movelist[mg_level][Indx][i]=capture_path[i];
            movelist[mg_level][Indx][depth]=promote[black][capture_path[depth-1]];
            movelist[mg_level][Indx][0]=depth;
            Indx++;
        }
    }
}

void crowncapture(int pp,int olddir,int depth)
{
    int left,right,i;
    int dd,dir,cap,p,np;
    int piece[5],cp[5];
    int findcap=false;

    left=olddir-1; if (left<0) left+=4;
    right=(olddir+1)%4;

    for(dd=0;dd<2;dd++) {
        dir=(dd==0)?left:right;
        cap=0; p=pp;
        do {
            p=next[mg_color][p][dir];
            if (board[p]==empty) {
                for(i=0;i<cap;i++) {
                    capture_path[depth+3*i]=cp[i];
                    capture_path[depth+3*i+1]=piece[i];
                    capture_path[depth+3*i+2]=p;
                }
                if (cap>0) {crowncapture(p,dir,depth+3*cap);}
                continue;
            } else if (board[p]==mg_eneman || board[p]==mg_enecrown) {
                np=next[mg_color][p][dir];
                if (board[np]==empty) {
                    cp[cap]=p;
                    piece[cap]=board[p];
                    board[p]|=taken;
                    cap++;
                    findcap=true;
                }
                else break;
            } else {
                break;
            }
        } while(true);
        for(i=0;i<cap;i++) board[cp[i]]=piece[i];
    }
    
    if (findcap==false && depth>=capture) {
        if (depth>capture) {capture=depth; Indx=0;}
        for(i=1;i<depth;i++) movelist[mg_level][Indx][i]=capture_path[i];
        movelist[mg_level][Indx][depth]=mg_owncrown;
        movelist[mg_level][Indx][0]=depth;
        Indx++;
    }
    return;
}

int crownmove(int pp)
{
    int cap;
    int dir,np;
    int i,p;
    int cp[5],piece[5];
    /* if dir is given:
          find hit or do move in dir
       if dir not given:
          for all hits crownmove
          do moves
    */
    board[pp]=empty;
    for(dir=0;dir<4;dir++) {
        p=pp; cap=0;
        do {
            p=next[mg_color][p][dir];
            if (p==invalid || board[p]==mg_ownman || board[p]==mg_owncrown) break;
            if (board[p]==empty) {
                if (cap>0) {
                    capture_path[1]=pp;
                    capture_path[2]=mg_owncrown;
                    for(i=0;i<cap;i++) {
                        capture_path[3+3*i]=cp[i];
                        capture_path[3+3*i+1]=piece[i];
                        capture_path[3+3*i+2]=p;
                    }

                    crowncapture(p,dir,3+3*cap);
                }
                else if (capture==0) {
                    movelist[mg_level][Indx][0]=4;
                    movelist[mg_level][Indx][1]=pp;
                    movelist[mg_level][Indx][2]=mg_owncrown;
                    movelist[mg_level][Indx][3]=p;
                    movelist[mg_level][Indx][4]=mg_owncrown;
                    Indx++;
                    continue;
                }
            }
            if (board[p]==mg_eneman || board[p]==mg_enecrown) {
                np=next[mg_color][p][dir];
                if (board[np]==empty) {
                    cp[cap]=p;
                    piece[cap]=board[p];
                    board[p]|=taken;
                    cap++;
                }
                else break;
            }
        } while(true);
        for(i=0;i<cap;i++) board[cp[i]]=piece[i];
    }
    board[pp]=mg_owncrown;
    return(0);
}

int move_list_wnc(int level)
{
    int ip,p;
    capture=0;
    mg_level=level;

    Indx=0;
    for(ip=5;ip!=50;ip++) {
        p=map[ip];
        if (board[p] == (white|man)) {
            /* capture moves */
            if (board[p-6]==(black|man) || board[p-7]==(black|man) ||
                    board[p+7]==(black|man) || board[p+6]==(black|man)) {
                board[p]=empty;
                capture_path[1]=p; capture_path[2]=(white|man);
                mancapture_wnc(p,3);
                board[p]=white|man;
            }
            if (capture==0) { /* non capture man moves */
                if (board[p-7]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=white|man;
                    movelist[level][Indx][3]=p-7;
                    movelist[level][Indx][4]=promote[white][p-7];
                    Indx++;
                }
                if (board[p-6]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=white|man;
                    movelist[level][Indx][3]=p-6;
                    movelist[level][Indx][4]=promote[white][p-6];
                    Indx++;
                }
            } /* end if capture */
        } /* end if ownman */
    } /* end for board */
    ngen+=Indx;
    if (Indx>=MAXNM) {
        set_col(31,31);printf("error: too many moves\n");res_col();
        display_board();
        Indx=MAXNM-1;
    }
    return(Indx);
}

int move_list_bnc(int level)
{
    int ip,p;
    capture=0;
    mg_level=level;

    Indx=0;
    for(ip=44;ip!=-1;ip--) {
        p=map[ip];
        if (board[p] == (black|man)) {
            /* capture moves */
            if (board[p-6]==(white|man) || board[p-7]==(white|man) ||
                    board[p+7]==(white|man) || board[p+6]==(white|man)) {
                board[p]=empty;
                capture_path[1]=p; capture_path[2]=(black|man);
                mancapture_bnc(p,3);board[p]=black|man;
            }
            if (capture==0) { /* non capture man moves */
                if (board[p+7]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=black|man;
                    movelist[level][Indx][3]=p+7;
                    movelist[level][Indx][4]=promote[black][p+7];
                    Indx++;
                }
                if (board[p+6]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=black|man;
                    movelist[level][Indx][3]=p+6;
                    movelist[level][Indx][4]=promote[black][p+6];
                    Indx++;
                }
            } /* end if capture */
        } /* end if ownman */
    } /* end for board */
    ngen+=Indx;
    if (Indx>=MAXNM) {
        set_col(31,31);printf("error: too many moves\n");res_col();
        display_board();
        Indx=MAXNM-1;
    }
    return(Indx);
}

int move_list(int level,int color)
{
    int ip,p;
    int p1,p2,dir,ehc=false;
    int ownman,owncrown,eneman,enecrown;
    int fl,fr,bl,br;

    if (level>=MAXPLY) {
        set_col(31,31);printf("error: too deep\n");res_col();
        display_board();
        exit(1);
    }
    nmovelist++;
    if (pieces[white|crown]==0 && pieces[black|crown]==0) {
        if (color==white) return(move_list_wnc(level));
        if (color==black) return(move_list_bnc(level));
    }
    /* general routine */
    ownman=man | color;
    owncrown=crown | color;
    eneman=man |! color;
    enecrown=crown |! color;
    capture=0;
    mg_level=level;
    mg_color=color;
    mg_eneman=eneman;
    mg_enecrown=enecrown;
    mg_owncrown=owncrown;
    mg_ownman=ownman;

    if ((color==white && pieces[black|crown]!=0) || (color==black && pieces[white|crown]!=0)) ehc=true;
    Indx=0;

if (color==white) {p1=0; p2=50; dir=1;fl=-7; fr=-6; bl=+6;br=+7;}
    else {p1=49; p2=-1; dir=-1;fl=+7; fr=+6; bl=-6; br=-7;}

    for(ip=p1;ip!=p2;ip+=dir) {
        p=map[ip];
        if (board[p] == ownman) {

            /* capture moves */
            if (color==white) {
                if (board[p-6]==eneman || board[p-7]==eneman ||
                        board[p+7]==eneman || board[p+6]==eneman) {
                    capture_path[1]=p; capture_path[2]=ownman;
                    board[p]=empty;
                    mancapture(p,3,-1);
                    board[p]=ownman;
                    goto scipcr;
                }
            }
            else if (board[p+6]==eneman || board[p+7]==eneman ||
                     board[p-7]==eneman || board[p-6]==eneman) {
                capture_path[1]=p; capture_path[2]=ownman;
                board[p]=empty;
                mancapture(p,3,-1);
                board[p]=ownman;
                goto scipcr;
            }
            if (ehc==true) if (board[next[color][p][forright]]==enecrown ||
                                   board[next[color][p][forleft]]==enecrown ||
                                   board[next[color][p][backright]]==enecrown ||
                                   board[next[color][p][backleft]]==enecrown) {
                    capture_path[1]=p; capture_path[2]=ownman;
                    board[p]=empty;
                    mancapture(p,3,-1);
                    board[p]=ownman;
                }
scipcr:
            if (capture==0) { /* non capture man moves */
                if (board[p+fl]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=board[p];
                    movelist[level][Indx][3]=p+fl;
                    movelist[level][Indx][4]=promote[color][p+fl];
                    Indx++;
                }
                if (board[p+fr]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=board[p];
                    movelist[level][Indx][3]=p+fr;
                    movelist[level][Indx][4]=promote[color][p+fr];
                    Indx++;
                }
            } /* end if capture */
        } /* end if ownman */
        /* crown moves */
        else if (board[p] == owncrown) crownmove(p);
    } /* end for board */
    ngen+=Indx;
    if (Indx>=MAXNM) {
        set_col(31,31);printf("error: too many moves\n");res_col();
        display_board();
        Indx=MAXNM-1;
    }
    return(Indx);
}

void xprint_move(char *move)
{
    int j,m;
    extern int progress[50];
    int xprogress[50]={
                          1,   3,   5,   7,   9,
                          0,   2,   4,   6,   8,
                          1,   3,   5,   7,   9,
                          0,   2,   4,   6,   8,
                          1,   3,   5,   7,   9,
                          0,   2,   4,   6,   8,
                          1,   3,   5,   7,   9,
                          0,   2,   4,   6,   8,
                          1,   3,   5,   7,   9,
                          0,   2,   4,   6,   8,
                      };

    m=move[0];
if (m==0) {return;}

    if (m==4) printf("xreponse ... %c%c%c%c",'a'+xprogress[invmap[move[1]]],'1'+progress[invmap[move[1]]],'a'+xprogress[invmap[move[3]]],'1'+progress[invmap[move[3]]]);
    else {
        printf("xreponse ... %c%c%c%c",'a'+xprogress[invmap[move[1]]],'1'+progress[invmap[move[1]]],'a'+xprogress[invmap[move[m-1]]],'1'+progress[invmap[move[m-1]]]);
        /*printf("%i",invmap[move[1]]+1);
        for(j=5;j<m;j+=3) printf("x%i",invmap[move[j]]+1);*/
    }
    printf(" ");
    xprintboard();
}

void print_move(char *move)
{
    int j,m;

    m=move[0];
    if (m==0) {return;}

#ifdef notdef
    for(j=0;j<=m;j++) dprint("%i ",move[j]);
    printf("\n");
#endif
    if (m==4) dprint("%i-%i",invmap [move[1]]+1,invmap[move[3]]+1);
    else {
        dprint("%i",invmap[move[1]]+1);
        for(j=5;j<m;j+=3) dprint("x%i",invmap[move[j]]+1);
    }
}

void print_move_damExchange(char *move,int timeInSec)
{
    int j,m;

    if (timeInSec>9999) timeInSec=9999;
    
    m=move[0];
    if (m==0) {return;}

    for(j=0;j<=m;j++) dprint("%i ",move[j]);
    printf("\n");

    printf("%i\n",m);
    dprint("\n");
    dprint("DEMOVE|M%4i",timeInSec);
    if (m==4) dprint("%2i%2i00",invmap [move[1]]+1,invmap[move[3]]+1);
    else {
        dprint("%2i",invmap[move[1]]+1);
        dprint("%2i",invmap[move[m-1]]+1);
        dprint("%2i",(m-3)/3);
        for(j=3;j<(m-2);j+=3) dprint("%2i",invmap[move[j]]+1);
    }
    dprint("\n");
}

void fprint_move(FILE *out,char *move)
{
    int j,m;

    m=move[0];
    if (m==0) {return;}

    if (m==4) fprintf(out,"%i-%i",invmap[move[1]]+1,invmap[move[3]]+1);
    else {
        fprintf(out,"%i",invmap[move[1]]+1);
        for(j=5;j<m;j+=3) fprintf(out,"x%i",invmap[move[j]]+1);
    }
}

void sprint_move(char *out,char *move)
{
    int j,m;
    int p=0;
    m=move[0];
    if (m==0) {return;}

    if (m==4) sprintf(out,"%i-%i",invmap[move[1]]+1,invmap[move[3]]+1);
    else {
        p=sprintf(out,"%i",invmap[move[1]]+1);
        for(j=5;j<m;j+=3) p+=sprintf(&out[p],"x%i",invmap[move[j]]+1);
    }
}

void win_print_move(char *move)
{
    char movebuffer[128];
    sprint_move(movebuffer,move);
    winprint("\nMOVE|%s\n",movebuffer);
}

void fprint_move_pdn(FILE *out,char *move)
{
    int j,m;

    m=move[0];
    if (m==0) {return;}

    if (m==4) fprintf(out,"%i-%i",invmap[move[1]]+1,invmap[move[3]]+1);
    else {
        fprintf(out,"%i",invmap[move[1]]+1);
        fprintf(out,"x%i",invmap[move[m-1]]+1);
    }
}


void print_movelist(int level,int n)
{
    int i;

    for(i=0;i<n;i++) {
        print_move(movelist[level][i]);
        dprint(" ");
    }
    dprint("\n");
}

void do_move(char *move)
{
    int i,length;

    length=move[0];
    if (length>=MOVEL) printf("move too long %i\n",length);
    pieces[move[2]]--; pieces[move[length]]++;
    board[move[1]]=empty;
    board[move[length-1]]=move[length];

    for(i=3;i<length-1;i+=3) {
        pieces[move[i+1]]--;
        board[move[i]]=empty;
    }
    return;
}

void undo_move(char *move)
{
    int i,length;

    length=move[0];
    pieces[move[2]]++; pieces[move[length]]--;
    board[move[length-1]]=empty;
    board[move[1]]=move[2];

    for(i=3;i<length-1;i+=3) {
        pieces[move[i+1]]++;
        board[move[i]]=move[i+1];
    }
    return;
}

int reverse_crownmove(int pp)
{
    int cap;
    int dir,np;
    int i,p;
    int cp[5],piece[5];
    /* if dir is given:
       find hit or do move in dir
       if dir not given:
       for all hits crownmove
       do moves
       */
    for(dir=0;dir<4;dir++) {
        p=pp; cap=0;
        do {
            p=next[mg_color][p][dir];
            if (board[p]!=empty) break;
            if (capture==0) {
                movelist[mg_level][Indx][0]=4;
                movelist[mg_level][Indx][1]=pp;
                movelist[mg_level][Indx][2]=mg_owncrown;
                movelist[mg_level][Indx][3]=p;
                movelist[mg_level][Indx][4]=mg_owncrown;
                Indx++;
                continue;
            }
        } while(true);
        for(i=0;i<cap;i++) board[cp[i]]=piece[i];
    }
    return(0);
}

int reverse_move_list(int level,int color)
{
    int ip,p;
    int p1,p2,dir,ehc=false;
    int ownman=man | color;
    int owncrown=crown | color;
    int eneman=man |! color;
    int enecrown=crown |! color;
    int fl,fr,bl,br;

    if (level>=MAXPLY) {
        set_col(31,31);printf("error: too deep\n");res_col();
        display_board();
        exit(1);
    }

    nmovelist++;
    capture=0;
    mg_level=level;
    mg_color=color;
    mg_eneman=eneman;
    mg_enecrown=enecrown;
    mg_owncrown=owncrown;
    mg_ownman=ownman;
    if ((color==white && pieces[black|crown]!=0) || (color==black && pieces[white|crown]!=0)) ehc=true;
    Indx=0;

if (color==white) {p1=0; p2=50; dir=1;fl=-7; fr=-6; bl=+6;br=+7;}
    else {p1=49; p2=-1; dir=-1;fl=+7; fr=+6; bl=-6; br=-7;}

    for(ip=p1;ip!=p2;ip+=dir) {
        p=map[ip];
        if (board[p] == ownman) {
            if (capture==0) { /* non capture man moves */
                if (board[p-fl]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=ownman;
                    movelist[level][Indx][3]=p-fl;
                    movelist[level][Indx][4]=ownman;
                    Indx++;
                }
                if (board[p-fr]==empty) {
                    movelist[level][Indx][0]=4;
                    movelist[level][Indx][1]=p;
                    movelist[level][Indx][2]=ownman;
                    movelist[level][Indx][3]=p-fr;
                    movelist[level][Indx][4]=ownman;
                    Indx++;
                }
            } /* end if capture */
        } /* end if ownman */
        /* crown moves */
        else if (board[p] == owncrown) reverse_crownmove(p);
    } /* end for board */
    ngen+=Indx;
    if (Indx>=MAXNM) {
        set_col(31,31);printf("error: too many moves\n");res_col();
        display_board();
        Indx=MAXNM-1;
    }
    return(Indx);
}

int has_promote(int color)
/* returns true if color can promote, false otherwise */
{
    if (color==white) {
        if (board[F6]==(white|man))
            if (board[F1]==empty) return true;
        if (board[F7]==(white|man))
            if (board[F1]==empty || board[F2]==empty) return true;
        if (board[F8]==(white|man))
            if (board[F2]==empty || board[F3]==empty) return true;
        if (board[F9]==(white|man))
            if (board[F3]==empty || board[F4]==empty) return true;
        if (board[F10]==(white|man))
            if (board[F4]==empty || board[F5]==empty) return true;
    }
    if (color==black) {
        if (board[F41]==(black|man))
            if (board[F46]==empty || board[F47]==empty) return true;
        if (board[F42]==(black|man))
            if (board[F47]==empty || board[F48]==empty) return true;
        if (board[F43]==(black|man))
            if (board[F48]==empty || board[F49]==empty) return true;
        if (board[F44]==(black|man))
            if (board[F49]==empty || board[F50]==empty) return true;
        if (board[F45]==(black|man))
            if (board[F50]==empty) return true;
    }

    return(false);
}
