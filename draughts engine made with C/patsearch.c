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

/* most code here is obsolete, but there is new code on the end */

#include <stdio.h>
#include "var.h"
#include "functions.h"

int npat=0;

char tic[NPAT];
int uuu=0;
#define MAXv(a,b) (a)>(b)?a:b;
struct _pattree {
    char field;
    char question;
    int yes;
    int no;
    short int pat[10];
} pattree[PATTREE+2];
int npattree=1;
int biggestp;

struct BMPATTERN {
    unsigned int p1;
    unsigned int p2;
} bmPattern[50];

struct BMPATTERN bmPatternInit[50];
struct BMPATTERN bmFilter[50][50][8];

/* new code */
int mapTo4[100]; /* maps board-value to OPP,FREE,BORDER,OWN */

/* old code */
int pat_info(int p,int *best)
{
    int i,vali,score;
    int count[128];
    int total=0,x;
    int w[8]={white|man,white|crown,black|man,black|crown,empty};

    for(i=0;i<128;i++) count[i]=0;
    for(i=0;i<npat;i++) if (tic[i]==true) {
            count[tpat[i].board[p]]++; total++;
        }

    if (count[OPTION]==total) return(INF);
    score=INF; *best=-1;
    for(i=0;i<5;i++) {
        x=w[i];
        vali=MAXv(count[OPTION]+count[x],total-count[x]);
        if (vali<score) { score=vali; *best=x; }
    }
    if (score>=total) return(INF);
    if (total<50) {
        total-=count[OPTION]; count[OPTION]*=3.5; total+=count[OPTION];
    }
    else {
        total-=count[OPTION]; count[OPTION]*=2.0; total+=count[OPTION];
    }
    score=INF;
    for(i=0;i<5;i++) {
        x=w[i];
        vali=MAXv(count[OPTION]+count[x],total-count[x]);
        if (vali<score) { score=vali; *best=x; }
    }
    return(score);
}

void rec_tree(int level,int oldn,int my_node)
{
    int info,i,j,best,bestp,bestc,n=0,p,bestx;
    int mytic[NPAT];

    uuu++;
    for(j=0;j<npat;j++) if (tic[j]==true) n++;
#ifdef notdef
    for(i=0;i<level;i++) printf("  ");
if (oldn==n) {printf("no progress:%i\n",n); return;}
    printf("%i\n",n);
#endif
    /* select optimal choice: bestp,bestc*/
    best=INF;
    for(i=0;i<50;i++) {
        info=pat_info(i,&bestx);
        if (info<best) {
            best=info;
            bestp=i;
            bestc=bestx;
        }
    }

    if (best==INF) {
        int p=0;
        pattree[my_node].field=127;
        pattree[my_node].question=127;
        for(j=0;j<npat;j++) if (tic[j]==true) {
                pattree[my_node].pat[p++]=j;
                if (p>biggestp) biggestp=p;
            }
    if (p>10) {printf("fatal: too many patterns in node\n"); exit(1);}
        pattree[my_node].yes=p;
        return;
    }
    /* save tics */
    for(j=0;j<npat;j++) mytic[j]=tic[j];
    pattree[my_node].field=bestp;
    pattree[my_node].question=bestc;

    /* choose bestp,bestc */
    for(j=0;j<npat;j++) if (tic[j]==true) {
            tic[j]=false;
            if (tpat[j].board[bestp]==bestc || tpat[j].board[bestp]==OPTION) tic[j]=true;
        }
    pattree[my_node].yes=npattree;
    rec_tree(level+1,n,npattree++);

    /* choose not bestp,bestc */
    for(j=0;j<npat;j++) tic[j]=mytic[j];
    for(j=0;j<npat;j++) if (tic[j]==true) {
            tic[j]=false;
            if (tpat[j].board[bestp]!=bestc) tic[j]=true;
        }
    pattree[my_node].no=npattree;
    rec_tree(level+1,n,npattree++);

    /* reset tics */
    for(j=0;j<npat;j++) tic[j]=mytic[j];
}

void make_pat_tree(void)
{
    int i;
    if (npat<1) return;
    npattree=1;
    biggestp=0;
    for(i=0;i<npat;i++) tic[i]=true;
    rec_tree(0,-1,0);
    printf("%i recursive calls to rec_tree\n",uuu);
    printf("%i tree nodes\n",npattree);
    printf("biggest p:%i\n",biggestp);
}

void load_pat_tree(void)
{
    npattree=bin_load("files/pattern_tree",sizeof(pattree[0]),pattree);
}

void save_pat_tree(void)
{
    bin_save("files/pattern_tree",npattree,sizeof(pattree[0]),pattree);
}

void load_seperate_patterns(int n)
{
    int pat,ok,ip,p,i;
    char filename[256];
    BTYPE temp[93];

    if (n+1>=NPAT) {
        printf("FATAL: too many patterns\n");
        exit(1); /* better be safe */
    }
    copy_board(temp,board);
    pat=0;
    for(p=0;p<n;p++) {
        sprintf(filename,"patterns/%.3i",p);
        printf("opening pattern file:%s\r",filename);
        ok=load_board(filename);
        if (ok==false) {
            printf("pattern not found\n");
            continue;
        }
        tpat[pat].use_succes=tpat[pat].use_fail=0;
        for(ip=0;ip<50;ip++) tpat[pat].board[ip]=board[map[ip]];
        tpat[pat].nmoves=PV[1][0][0];
        for(i=0;i<PV[1][0][0];i++) movecopy(tpat[pat].movelist[i],PV[0][i]);
        pat++;
        /*print_move(tpat[pat].movelist[0]); printf("\n");*/
    }
    printf("\n%i patterns loaded\n",pat);
    npat=n;
}

void save_bin_patterns(void)
{
    bin_save("files/patterns.bin",npat,sizeof(tpat[0]),tpat);
}

void init_tpat(void)
{
    int n;
    BTYPE temp[93];
    n=bin_size("files/patterns.bin");
    if (n<=0) return;
    if (n>NPAT) {
        printf("FATAL: too many patterns\n");
        exit(1); /* better be safe */
    }
    npat=bin_load("files/patterns.bin",sizeof(tpat[0]),tpat);
    printf("%i patterns in 'patterns.bin'\n",n);
    load_pat_tree(); /* we are not sure the tree corresponds with
          the patterns */
}


void tpat_stats(void)
{
    int i,n,succes=0,fail=0;
    float succes_rate;
    for(i=0;i<npat;i++) {
        succes+=tpat[i].use_succes;
        fail+=tpat[i].use_fail;
        if (tpat[i].use_succes!=0 || tpat[i].use_fail!=0) printf("pattern: %3i succes:%i  fail:%i\n",i,tpat[i].use_succes,tpat[i].use_fail);
    }
    printf("bad patterns:\n");
    for(i=0;i<npat;i++) {
        n=tpat[i].use_succes+tpat[i].use_fail;
        if (n>50) {
            succes_rate=(float)tpat[i].use_succes/n;
            if (succes_rate<.3) printf("pattern: %3i succes:%i  fail:%i\n",i,tpat[i].use_succes,tpat[i].use_fail);
        }
    }
    printf("\n");
    printf("very bad patterns:\n");
    for(i=0;i<npat;i++) {
        n=tpat[i].use_succes+tpat[i].use_fail;
        if (n>50) {
            succes_rate=(float)tpat[i].use_succes/n;
            if (succes_rate<.08) printf("pattern: %3i succes:%i  fail:%i\n",i,tpat[i].use_succes,tpat[i].use_fail);
        }
    }
    printf("\n");
    if (succes>0 || fail>0) printf("total succes:%i  total fail:%i, rating:%f\n",succes,fail,(float) succes/(succes+fail));
}

void save_tpat(void)
{
    int pat,ok,ip,p,i,j;
    char filename[256];
    FILE *out;
    for(pat=0;pat<npat;pat++) {
        sprintf(filename,"patterns/%.3i",pat);
        for(i=0;i<50;i++) board[map[i]]=tpat[pat].board[i];
        save_board(2,filename);
        out=fopen(filename,"a");
    if (out==NULL) {printf("append error %i\n",pat); continue;}
        fprintf(out,"@ %c",(char) (48+tpat[pat].nmoves));
        for(i=0;i<tpat[pat].nmoves;i++) {
            for(j=tpat[pat].movelist[i][0]+1;j<32;j++) tpat[pat].movelist[i][j]=0;
            for(j=0;j<32;j++) fprintf(out,"%c",(char) (32+tpat[pat].movelist[i][j]));
        }
        fclose(out);
    }
}

int tpat_ispattern(int pat,int color)
{
    int match,ip;

    match=true;

    if (color==white) {
        for(ip=0;ip<50;ip++) if (tpat[pat].board[ip]!=OPTION && tpat[pat].board[ip]!=board[map[ip]]) {
                match=false;
                return(false);
            }
    } else {
        for(ip=0;ip<50;ip++) if (tpat[pat].board[ip]!=OPTION && tpat[pat].board[ip]!=reverse_color[board[map[49-ip]]]) {
                match=false;
                return(false);
            }
    }
    if (match==true) return(true);
    return(false); /* never get here */
}

int tpat_reconize_search(int color)
{
    int pat;

    pat=-1;
    for(pat=0;pat<npat;pat++) {
        if (tpat_ispattern(pat,color)==true) return(pat);
    }
    return(-1);
}

int tpat_reconize(int color)
{
    int pat,search,tree=-1,i,node;

    /*return(tpat_reconize_search(color));*/

    node=0;
    do {
        if (pattree[node].field==127) {
            for(i=0;i<(pat=pattree[node].yes);i++) {
                if (tpat_ispattern(pattree[node].pat[i],color)==true) {tree=pattree[node].pat[i]; break;}
            }
            break;
        }
        if (color==white) {
            if (board[map[pattree[node].field]]==pattree[node].question) node=pattree[node].yes;
            else node=pattree[node].no;
        }
        else if (color==black) {
            if (board[map[49-pattree[node].field]]==reverse_color[pattree[node].question]) node=pattree[node].yes;
            else node=pattree[node].no;
        }
    } while(1==1);
    /*  if (search!=-1 || tree!=-1) printf("full search: %i tree search: %i   %i\n",search,tree,pat);*/
    return(tree);
}

int palfabeta(int alfa,int beta,int color,int cdepth,int depth)
{
    int nmoves,nr,score,best,bestnr,q,nextdepth;
    char nullmove[32]={4,0,0,0,0};
    int dummy;
    
    bestnr=-1; best=-INF;
    if (depth<=0 || (color==black && quiet(color)==true)) {
        storemove(cdepth,nullmove);
        return(evalboard(color,-INF,INF,&dummy));
    }
    nmoves=move_list(cdepth,color);
    if (nmoves==0) {
        storemove(cdepth,nullmove);
        return(LOSE);
    }
    for(nr=0;nr<nmoves;nr++) {
        do_move(movelist[cdepth][nr]);
        nextdepth=depth-100;
        if (nextdepth<=0) { /* last move ? : check quiescence */
            q=quiet(color^1);
            if (q==false) nextdepth=1;
        }
        if (color==white && nextdepth>0) if (move_list(cdepth+1,color^1)!=1) {
                undo_move(movelist[cdepth][nr]);
                continue;
            }
        score=-palfabeta(-beta,-alfa,color ^1,cdepth+1,nextdepth);
        undo_move(movelist[cdepth][nr]);
        if (score>=beta) {
            storemove(cdepth,movelist[cdepth][nr]);
            return(score);
        }
        if (score>best) {bestnr=nr; best=score;storemove(cdepth,movelist[cdepth][bestnr]);}
        if (score>alfa) alfa=score;
    }
    return(alfa);
}

void assert_option(int *option,char *move,int mycolor)
{
    int i,p;

    if (move[0]==4) {
        option[move[1]]=false;
        option[move[3]]=false;
    }
    else {
        option[move[1]]=false; /* original position */
        for(i=3;i<move[0];i+=3) {
            option[move[i+2]]=false;  /* jumpto */
            option[move[i+0]]=false;  /* jumpover */
            p=move[i+2];
            if (board[p+12]!=invalid) option[p+6]=false;
            if (board[p+6]!=empty && board[p+6]!=(mycolor|man) && board[p+6]!=(mycolor|crown)) option[p+12]=false;

            if (board[p+14]!=invalid) option[p+7]=false;
            if (board[p+7]!=empty && board[p+7]!=(mycolor|man) && board[p+7]!=(mycolor|crown)) option[p+14]=false;

            if (board[p-12]!=invalid) option[p-6]=false;
            if (board[p-6]!=empty && board[p-6]!=(mycolor|man) && board[p-6]!=(mycolor|crown)) option[p-12]=false;

            if (board[p-14]!=invalid) option[p-7]=false;
            if (board[p-7]!=empty && board[p-7]!=(mycolor|man) && board[p-7]!=(mycolor|crown)) option[p-14]=false;
        }
        option[p+6]=option[p+7]=option[p-6]=option[p-7]=false;
    }
}

int searchpat(void)
{
    int pat,match,i;

    for(pat=0;pat<npat;pat++) {
        match=true;
        for(i=0;i<50;i++) if (tpat[pat].board[i]!=OPTION && tpat[pat].board[i]!=board[map[i]]) {match=false;break;}
        if (match==true) return(pat);
    }
    return(-1);
}

int search_tight_pat(void)
{
    int pat,match,i;

    for(pat=0;pat<npat;pat++) {
        match=true;
        for(i=0;i<50;i++) if (board[map[i]]!=OPTION && tpat[pat].board[i]!=board[map[i]]) {match=false;break;}
        if (match==true) return(pat);
    }
    return(-1);
}

void addpat(void)
{
    int ip,i;
    int mypat,tight;

    if (npat>=NPAT) {
        printf("out of space\n");
        return;
    }
    tight=search_tight_pat();
    if (tight==-1) mypat=npat; else mypat=tight;
    for(ip=0;ip<50;ip++) tpat[mypat].board[ip]=board[map[ip]];
    i=0;
    while(PV[0][i][1]!=0) {
        movecopy(tpat[mypat].movelist[i],PV[0][i]);
        i++;
    }
    tpat[mypat].nmoves=i;
    tpat[mypat].use_succes=tpat[mypat].use_fail=0;
    if (tight==-1) {
        npat++;
        printf("added pattern %i\n",mypat);
    }
    else {
        printf("overwrote pattern %i\n",mypat);
    }
}

void plearn(int color,int plusscore)
{
    int cscore,depth,score,i;
    char input[100];
    int option[93];
    BTYPE temp[93];
    int dummy;
    
    if (color==black) {
        reverse_board(temp,board);
        copy_board(board,temp);
    }
    set_pieces();
    for(i=0;i<93;i++) temp[i]=board[i];
    maxpv=MPV;
    for(i=0;i<93;i++) option[i]=true;
    if (quiet(white)==false || quiet(black)==false) {
        return;
    }
    cscore=evalboard(white,-INF,INF,&dummy);
    for(depth=100;depth<600;depth+=100) {
        init_stats();
        score=palfabeta(-INF,INF,white,0,depth);
        printf("%i %i\n",depth,score);
        if (score>cscore+plusscore) {
            printf("last loaded file:'%s'\n",dcpfile);
            printf("win detected at depth=%i, score=%i\n",depth,score);
            print_pv(); print_stats();
            i=0;
            while(PV[0][i][1]!=0) {
                assert_option(option,PV[0][i],i%2);
                do_move(PV[0][i]);
                i++;
            }
            if (i<=1) {
                printf("illegal pattern detected\n");
                return;
            }
            for(i=0;i<93;i++) board[i]=temp[i];
            set_pieces();
            for(i=0;i<50;i++) if (option[map[i]]==true) board[map[i]]=OPTION;
            if (searchpat()>=0) {
                printf("pattern already present\n");
                break;
            }
            /*if (depth<500) break;*/
            display_board();
            addpat();
            for(i=0;i<93;i++) board[i]=temp[i];
            printf("original:\n");
            display_board();
            break;
        }
    }
}

void setMove(int cdepth,int color,int p1,int p2)
/* place a man-move as the first move in the movelist
   reverse board if neccessary */
{
    movelist[cdepth][0][0]=4;
    movelist[cdepth][0][2]=color|man;
    movelist[cdepth][0][4]=color|promote[white][p2];
    if (color==white) {
        movelist[cdepth][0][1]=p1;
        movelist[cdepth][0][3]=p2;
    } else
    {
        movelist[cdepth][0][1]=reverse_map[invmap[p1]];
        movelist[cdepth][0][3]=reverse_map[invmap[p2]];
    }
}


/* -----------------------------------------------------------
   below follows the new pattern matching code
   -----------------------------------------------------------
*/

void init_takeback()
{
    /* fills the takeback[] array. Value=0 is there is no takeback, 1 if there is one
       the six indices of the array each indicate a position on the board:
       11  ??  55 
         22  66
       ??  oo  ??
         ..  44
       ??  ??  33
       Where 11 is index1, 22 is index 2, etc, my man or crown
       each index has value 0=OWN,1=OPP,2=FREE,3=BORDER (not on the playing board)
       In the above diagram, we assume that the enemy is making a move and comes from
       the bottom left.
    */
    int i1,i2,i3,i4,i5,i6;
    int tb,i;
    
    for (i1=0;i1<4;i1++) {
        for (i2=0;i2<4;i2++) {
            for (i3=0;i3<4;i3++) {
                for (i4=0;i4<4;i4++) {
                    for (i5=0;i5<4;i5++) {
                        for (i6=0;i6<4;i6++) {
                            /* take another checker */
                            takeback[i1][i2][i3][i4][i5][i6]=0;
                            tb=1;
                            if (i1==FREE && i2==OPP) tb=0;
                            if (i3==FREE && i4==OPP) tb=0;
                            if (i5==FREE && i6==OPP) tb=0;
                            if (tb==1) {
                                tb=0;
                                if (i6==OPP && (i5==OPP || i5==BORDER)) tb=1;
                                if (i2==OPP && (i1==OPP || i1==BORDER) && i4==FREE) tb=1;
                                if (i4==OPP && (i3==OPP || i3==BORDER) && i2==FREE) tb=1;
                                takeback[i1][i2][i3][i4][i5][i6]=tb;
                            }
                        }
                    }
                }
            }
        }
    }
    printf("takeback %i\n",takeback[1][1][2][2][2][2]);
    for(i=0;i<99;i++) mapTo4[i]=127;
    mapTo4[white|man]=OWN;
    mapTo4[white|crown]=OWN;
    mapTo4[black|man]=OPP;
    mapTo4[black|crown]=OPP;
    mapTo4[empty]=FREE;
    mapTo4[invalid]=BORDER;
}
               
int npat_findOrig(int color,int cdepth)
/* returns true if pattern found */
{
    static BTYPE temp[93];
    BTYPE *local;  /* out local board */
    int mman,eman,mcrown,ecrown;  /* number of pieces on the board */
    int bbbr,bbbl,fffr,fffl,fl,fr,bl,br,bbl,bbr,ffr,ffl,l,r,f,b;  /* field-value at different position relative to current piece */
    int p,ip,pt;
    int i1,i2,i3,i4,i5,i6;
    
    pat_try++;
    
    /* makesure we work on a white to move board */
    if (color==white) {
        local=board;
        mman=pieces[white|man]; eman=pieces[black|man];
        mcrown=pieces[white|crown]; ecrown=pieces[black|crown];
    }
    else {
        local=temp;
        reverse_board(local,board);
        eman=pieces[white|man]; mman=pieces[black|man];
        ecrown=pieces[white|crown]; mcrown=pieces[black|crown];
    }

    
    for(ip=0;ip<50;ip++) {
        p=map[ip];
        fl=local[p-7];
        fr=local[p-6];
        bl=local[p+6];
        br=local[p+7];
        bbr=local[p+14];
        if (bbr!=invalid) bbbr=local[p+21]; else bbbr=invalid;
        bbl=local[p+12];
        if (bbl!=invalid) bbbl=local[p+18]; else bbbl=invalid;
        ffr=local[p-12];
        ffl=local[p-14];
        if (ffr!=invalid) fffr=local[p-18]; else fffr=invalid;
        if (ffl!=invalid) fffl=local[p-21]; else fffl=invalid;

        l=local[next[white][next[white][p][forleft]][backleft]];
        r=local[next[white][next[white][p][forright]][backright]];
        if (ip>=10) f=local[p-13]; else f=invalid;
        if (ip<=39) b=local[p+13]; else b=invalid;

        if (local[p]==man) {
            
            /* pattern:
            ??      ??
              ??  ??
                ..
              ??  bb  w.  bb
            ??      ..  ..
                      ..  ww
                    ??  ww
                  ??      ws
            */
            if (LWBOARD(p,-1,1)==empty && LWBOARD(p,0,2)==(black|man) && (LWBOARD(p,-4,2)==(black|man) || LWBOARD(p,-4,2)==(black|crown)) &&
            LWBOARD(p,-5,3)==empty && LWBOARD(p,-3,1)==empty && LWBOARD(p,-2,-0)==empty &&
            bl==man && (LWBOARD(p,0,-2)==man || LWBOARD(p,0,-2)==crown || LWBOARD(p,0,-2)==invalid) &&
            (ffl==empty || ffl==man || ffl==crown)) {
                i1=mapTo4[LWBOARD(p,-7,1)];
                i2=mapTo4[LWBOARD(p,-6,2)];
                i3=mapTo4[LWBOARD(p,-3,5)];
                i4=mapTo4[LWBOARD(p,-4,4)];
                i5=mapTo4[LWBOARD(p,-7,5)];
                i6=mapTo4[LWBOARD(p,-6,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                }
            }
            /* mirror */
            if (LWBOARD(p,1,1)==empty && LWBOARD(p,0,2)==(black|man) && (LWBOARD(p,4,2)==(black|man) || LWBOARD(p,4,2)==(black|crown)) &&
            LWBOARD(p,5,3)==empty && LWBOARD(p,3,1)==empty && LWBOARD(p,2,0)==empty &&
            br==man && (LWBOARD(p,0,-2)==man || LWBOARD(p,0,-2)==crown || LWBOARD(p,0,-2)==invalid) &&
            (ffr==empty || ffr==man || ffr==crown)) {
                i1=mapTo4[LWBOARD(p,7,1)];
                i2=mapTo4[LWBOARD(p,6,2)];
                i3=mapTo4[LWBOARD(p,3,5)];
                i4=mapTo4[LWBOARD(p,4,4)];
                i5=mapTo4[LWBOARD(p,7,5)];
                i6=mapTo4[LWBOARD(p,6,4)];
                /*printf("%i %i %i %i %i %i %i\n",i1,i2,i3,i4,i5,i6,takeback[i1][i2][i3][i4][i5][i6]);*/
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    /*printf("s\n");*/
                    setMove(cdepth,color,p,p-6);
                    return(true);
                }
            }
            /* pattern:
            bb  w.
              ..  ..      ??            
            ??  ww  bb  ??
              ww  ??  ..
            ws      ??  ??
                  ??      ??
            */
            if (
                fl==empty &&
                fr==empty &&
                ffl==(black|man) &&
                (r==(black|man) || r==(black|crown)) &&
                (bl==man || bl==crown) &&
                (bbl==man || bbl==crown || bbl==invalid) &&
                (f==man || f==crown || f==empty || (f==(black|man) && local[p-1]==man)) &&
                LWBOARD(p,3,-1)==empty
            ) {
                i1=mapTo4[LWBOARD(p,5,1)];
                i2=mapTo4[LWBOARD(p,4,0)];
                i3=mapTo4[LWBOARD(p,1,-3)];
                i4=mapTo4[LWBOARD(p,2,-2)];
                i5=mapTo4[LWBOARD(p,5,-3)];
                i6=mapTo4[LWBOARD(p,4,-2)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                }
            }
            /* mirror */
            printf("%i %i %i %i %i %i %i %i\n",p,fr,fl,ffr,l,br,bbr,f,local[p+1]);
            if (
                fr==empty &&
                fl==empty &&
                ffr==(black|man) &&
                (l==(black|man) || l==(black|crown)) &&
                (br==man || br==crown) &&
                (bbr==man || bbr==crown || bbr==invalid) &&
                (f==man || f==crown || f==empty || (f==(black|man) && local[p+1]==man)) &&
                LWBOARD(p,-3,-1)==empty
            ) {    
                printf("hallo\n");
                i1=mapTo4[LWBOARD(p,-5,1)];
                i2=mapTo4[LWBOARD(p,-4,0)];
                i3=mapTo4[LWBOARD(p,-1,-3)];
                i4=mapTo4[LWBOARD(p,-2,-2)];
                i5=mapTo4[LWBOARD(p,-5,-3)];
                i6=mapTo4[LWBOARD(p,-4,-2)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                    return(true);
                }
            }
            /* pattern:
                      w.  bb
            ??      ..  ..
              ??  bb  ..  ww
                ..  ??  ww
              ??  ??      ws  
            ??        
            */
            if (
                f==(black|man) &&
                bl==man &&
                (b==man || b==crown || b==invalid) &&
                fl==empty &&
                l==empty &&
                (ffl==empty || ffl==man || ffl==crown) &&
                LWBOARD(p,-3,1)==empty &&
                (LWBOARD(p,-4,0)==(black|man) || LWBOARD(p,-4,0)==(black|crown)) &
                LWBOARD(p,-5,-1)==empty
            ) {
                i1=mapTo4[LWBOARD(p,-3,-3)];
                i2=mapTo4[LWBOARD(p,-4,-2)];
                i3=mapTo4[LWBOARD(p,-7,1)];
                i4=mapTo4[LWBOARD(p,-6,0)];
                i5=mapTo4[LWBOARD(p,-7,-3)];
                i6=mapTo4[LWBOARD(p,-6,-2)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                } 
            }                
            /* mirror */
            if (
                f==(black|man) &&
                br==man &&
                (b==man || b==crown || b==invalid) &&
                fr==empty &&
                r==empty &&
                (ffr==empty || ffr==man || ffr==crown) &&
                LWBOARD(p,3,1)==empty &&
                (LWBOARD(p,4,0)==(black|man) || LWBOARD(p,4,0)==(black|crown)) &
                LWBOARD(p,5,-1)==empty
            ) {
                i1=mapTo4[LWBOARD(p,3,-3)];
                i2=mapTo4[LWBOARD(p,4,-2)];
                i3=mapTo4[LWBOARD(p,7,1)];
                i4=mapTo4[LWBOARD(p,6,0)];
                i5=mapTo4[LWBOARD(p,7,-3)];
                i6=mapTo4[LWBOARD(p,6,-2)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                    return(true);
                } 
            }
            /* pattern:
                ??      ??
                  ??  ??
                    ..
              bb  bb  ??
                ..  ??  ?? 
              ww  ww  
                ??  ww
              ??      ws   
            */
            /*if (p==54) printf("%i\n%i\n%i\n%i\n%i\n%i\n%i\n%",fl,ffl,br,bbr,f,l,LWBOARD(p,1,3));*/
                
            if (
                fl==empty &&
                ffl==(black|man) &&
                br==man &&
                (bbr==man || bbr==crown || bbr==invalid) &&
                (f==(black|man) || f==(black|crown)) &&
                (l==man || l==crown) &&
                LWBOARD(p,1,3)==empty
            ) {
                i1=mapTo4[LWBOARD(p,-1,5)];
                i2=mapTo4[LWBOARD(p,0,4)];
                i3=mapTo4[LWBOARD(p,3,1)];
                i4=mapTo4[LWBOARD(p,2,2)];
                i5=mapTo4[LWBOARD(p,3,5)];
                i6=mapTo4[LWBOARD(p,2,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                }
            }                
            /* mirror */
            if (
                fr==empty &&
                ffr==(black|man) &&
                bl==man &&
                (bbl==man || bbl==crown || bbl==invalid) &&
                (f==(black|man) || f==(black|crown)) &&
                (r==man || r==crown) &&
                LWBOARD(p,-1,3)==empty
            ) {
                i1=mapTo4[LWBOARD(p,1,5)];
                i2=mapTo4[LWBOARD(p,0,4)];
                i3=mapTo4[LWBOARD(p,-3,1)];
                i4=mapTo4[LWBOARD(p,-2,2)];
                i5=mapTo4[LWBOARD(p,-3,5)];
                i6=mapTo4[LWBOARD(p,-2,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                    return(true);
                }
            }                
            
            /*
                  ??      ??
                    ??  ??
                      ..
            bb  w.  bb  ??
              ..  ..      ??
            ??  ww  
              ww  ??
            ws      ??
            */
            if (
                fl==empty &&
                ffl==(black|man) &&
                fr==empty &&
                (f==empty || f==man || f==crown) &&
                (ffr==(black|man) || ffr==(black|crown)) &&
                bl==man &&
                (bbl==man || bbl==crown || bbl==invalid) &&
                LWBOARD(p,3,3)==empty
            ) {
                i1=mapTo4[LWBOARD(p,1,5)];
                i2=mapTo4[LWBOARD(p,2,4)];
                i3=mapTo4[LWBOARD(p,4,1)];
                i4=mapTo4[LWBOARD(p,4,2)];
                i5=mapTo4[LWBOARD(p,5,5)];
                i6=mapTo4[LWBOARD(p,4,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                }
            }                
            /* mirror */
            if (
                fr==empty &&
                ffr==(black|man) &&
                fl==empty &&
                (f==empty || f==man || f==crown) &&
                (ffl==(black|man) || ffl==(black|crown)) &&
                br==man &&
                (bbr==man || bbr==crown || bbr==invalid) &&
                LWBOARD(p,-3,3)==empty
            ) {
                i1=mapTo4[LWBOARD(p,-1,5)];
                i2=mapTo4[LWBOARD(p,-2,4)];
                i3=mapTo4[LWBOARD(p,-4,1)];
                i4=mapTo4[LWBOARD(p,-4,2)];
                i5=mapTo4[LWBOARD(p,-5,5)];
                i6=mapTo4[LWBOARD(p,-4,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                    return(true);
                }
            }                
                
            if (ecrown>0) {
                /* pattern: catch enemy crown 
                BB  ??   ??
                  ..  ??
                ??  ww  ??
                  ??  ww
                ??  ??  ws        
                */
                if (fl == empty && br == man && (bbr == man || bbr == invalid || bbr == crown)) {
                    int rayHasCrown=false;
                    pt=p;
                    do {
                        pt=next[0][pt][forleft];
                        if (pt==invalid) break;
                        if (local[pt]!=empty) {
                            if (local[pt]==(black|crown)) {
                                rayHasCrown=true;
                            }
                            break;
                        }
                    } while (true);
                    if (rayHasCrown==true) {
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                        return(true);
                    }
                }
                if (fr == empty && bl == man && (bbl == man || bbl == invalid || bbl == crown)) {
                    int rayHasCrown=false;
                    pt=p;
                    do {
                        pt=next[0][pt][forright];
                        if (pt==invalid) break;
                        if (local[pt]!=empty) {
                            if (local[pt]==(black|crown)) {
                                rayHasCrown=true;
                            }
                            break;
                        }
                    } while (true);
                    if (rayHasCrown==true) {
                        pat_found++;
                        setMove(cdepth,color,p,p-6);
                        return(true);
                    }
                }
                /* pattern: catch enemy crown 
                ??  ??   ws
                  ??  ww
                ..  ..  ??
                  ??  ??
                BB  ww  ??        
                */
                if (bl == empty && bbl == empty && (fr == man || fr == invalid || fr == crown)) {
                    if (local[p+19] == man && local[p+5]==empty) {
                        int rayHasCrown=false;
                        pt=p;
                        do {
                            pt=next[0][pt][backleft];
                            if (pt==invalid) break;
                            if (local[pt]!=empty) {
                                if (local[pt]==(black|crown)) {
                                    rayHasCrown=true;
                                }
                                break;
                            }
                        } while (true);
                        if (rayHasCrown==true) {
                            pat_found++;
                            setMove(cdepth,color,p+19,p+12);
                            return(true);
                        }
                    }
                }
                /* mirror */
                if (br == empty && bbr == empty && (fl == man || fl == invalid || fl == crown)) {
                    if (local[p+20] == man && local[p+8]==0) {
                        int rayHasCrown=false;
                        pt=p;
                        do {
                            pt=next[0][pt][backright];
                            if (pt==invalid) break;
                            if (local[pt]!=empty) {
                                if (local[pt]==(black|crown)) {
                                    rayHasCrown=true;
                                }
                                break;
                            }
                        } while (true);
                        if (rayHasCrown==true) {
                            pat_found++;
                            setMove(cdepth,color,p+20,p+14);
                            return(true);
                        }
                    }
                }

            }
        }
    }
    return(false);
}


int npat_find(int color,int cdepth)
/* patterns that checked at the evaluation level
   sets suggested move */
/* returns true if pattern found */
{
    static BTYPE temp[93];
    BTYPE *local;  /* out local board */
    int ecrown;  /* number of pieces on the board */
    int l,r,f,b;  /* field-value at different position relative to current piece */
    int p,ip,pt;
    int i1,i2,i3,i4,i5,i6;
    
    
    /* makesure we work on a white to move board */
    if (color==white) {
        local=board;
        ecrown=pieces[black|crown];
    }
    else {
        local=temp;
        reverse_board(local,board);
        ecrown=pieces[white|crown];
    }
    detectPatterns(local);
    pat_try++;
    for(ip=10;ip<50;ip++) {
        p=map[ip];
        if (local[p]==man) {
            /*   threat  
            *  ??  ??
            *    ??      ??
            *      ??  ..
            *        ..  
            *      w.  bb  w.
            *        ..  ..
            *      ww  ww  ww
            */
            /*if (local[p-1]==man && local[p+1]==man && local[p-7]==empty && local[p-13]==(black|man) && local[p-6]==empty &&
                (local[p-14]==empty || local[p-14]==man) && (local[p-12]==empty || local[p-12]==man) &&
                LWBOARD(p,-1,3)==empty
            ) {
                if (LWBOARD(p,-2,4)==empty && LWBOARD(p,0,4)==empty) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                    return(true);
                }                    
                if (LWBOARD(p,2,4)==empty && LWBOARD(p,0,4)==empty) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                }
            }*/
            /* threat
          *   ??        
          *     ??    
          *       ..
          *     ww  bb
          *       ..  ..
          *         ww  ws
            */
            /*if (local[p-7]==empty && local[p-6]==empty &&
                (local[p+1]==(white|man) || local[p+1]==invalid) &&
                local[p-14]==(white|man) && local[p-13]==(black|man) && LWBOARD(p,-1,3)==empty
            ) {
                i1=mapTo4[LWBOARD(p,-3,1)];
                i2=mapTo4[LWBOARD(p,-2,2)];
                i3=mapTo4[LWBOARD(p,1,5)];
                i4=mapTo4[LWBOARD(p,0,4)];
                i5=mapTo4[LWBOARD(p,-3,5)];
                i6=mapTo4[LWBOARD(p,-2,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    //display_board();
                    //printf("c: %i\n",color);
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                    return(true);
                }
            } */               
            /* mirror */        
            /*
            if (eval_type==3 && local[p-6]==empty && local[p-7]==empty &&
                (local[p-1]==(white|man) || local[p-1]==invalid) &&
                local[p-12]==(white|man) && local[p-13]==(black|man) && LWBOARD(p,1,3)==empty
            ) {
                i1=mapTo4[LWBOARD(p,3,1)];
                i2=mapTo4[LWBOARD(p,2,2)];
                i3=mapTo4[LWBOARD(p,-1,5)];
                i4=mapTo4[LWBOARD(p,0,4)];
                i5=mapTo4[LWBOARD(p,3,5)];
                i6=mapTo4[LWBOARD(p,2,4)];
                if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                    return(true);
                }
            }                
            */
            /* promotion prevention
                   ..
                 bb  ww
               ??  ??
             **  **  **
            
             */
            if (p>=F41 && p<=F45) {
                if (p>=F42) {
                    if (local[p-1]==(black|man) && local[p-7]==empty) {
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                           return(true);
                    }
                }
                if (p<=F44) {
                    if (local[p+1]==(black|man) && local[p-6]==empty) {
                        pat_found++;
                        setMove(cdepth,color,p,p-6);
                           return(true);
                    }
                }
            }
            /* pattern
            *                ..           ..   
            *              bb               bb
            *        w.  bb               w.  bb
            *          ..  bb               ..  bb
            *        ww  ??  ww           ww  ??  ww
            *                  ws                   ws
            */
            if (local[p-6]==empty && local[p-12]==(black|man) && LWBOARD(p,3,1)==(black|man) && LWBOARD(p,4,0)==(white|man) && 
                (local[p-13]==empty || local[p-13]==(white|man) || (local[p-13]==(black|man) && local[p+1]!=empty)) &&
                (LWBOARD(p,5,-1)!=empty) && !(local[p+1]==(black|man) && local[p-13]==empty)
            ) {
                if (LWBOARD(p,3,3)==(black|man) && LWBOARD(p,4,4)==empty) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                       return(true);
                }
                if (LWBOARD(p,1,3)==(black|man) && LWBOARD(p,0,4)==empty) {
                    pat_found++;
                    setMove(cdepth,color,p,p-6);
                       return(true);
                }
            }
            if (local[p-7]==empty && local[p-14]==(black|man) && LWBOARD(p,-3,1)==(black|man) && LWBOARD(p,-4,0)==(white|man) && 
                (local[p-13]==empty || local[p-13]==(white|man) || (local[p-13]==(black|man) && local[p-1]!=empty)) &&
                (LWBOARD(p,-5,-1)!=empty) && !(local[p-1]==(black|man) && local[p-13]==empty)
            ) {
                if (LWBOARD(p,-3,3)==(black|man) && LWBOARD(p,-4,4)==empty) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                       return(true);
                }
                if (LWBOARD(p,-1,3)==(black|man) && LWBOARD(p,0,4)==empty) {
                    pat_found++;
                    setMove(cdepth,color,p,p-7);
                       return(true);
                }
            }
            if ((bmPattern[ip].p1 & 16383)!=0) {
                /* pattern:
                ??      ??
                  ??  ??
                    ..
                  ??  bb  w.  bb
                ??      ..  ..
                          ..  ww
                        ??  ww
                      ??      ws
                */
            
                l=local[p-1];
                r=local[p+1];
                if (ip<=39) b=local[p+13]; else b=invalid;

                if ((bmPattern[ip].p1 & PAT1)!=0 &&
                    (LWBOARD(p,-4,2)==(black|man) || LWBOARD(p,-4,2)==(black|crown)) &&
                    LWBOARD(p,-5,3)==empty && LWBOARD(p,-3,1)==empty && LWBOARD(p,-2,-0)==empty &&
                    (LWBOARD(p,0,-2)==man || LWBOARD(p,0,-2)==crown || LWBOARD(p,0,-2)==invalid)   
                ) {
                    i1=mapTo4[LWBOARD(p,-7,1)];
                    i2=mapTo4[LWBOARD(p,-6,2)];
                    i3=mapTo4[LWBOARD(p,-3,5)];
                    i4=mapTo4[LWBOARD(p,-4,4)];
                    i5=mapTo4[LWBOARD(p,-7,5)];
                    i6=mapTo4[LWBOARD(p,-6,4)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                        return(true);
                    }
                }
                /* mirror */
                if ((bmPattern[ip].p1 & PAT2)!=0 &&
                    (LWBOARD(p,4,2)==(black|man) || LWBOARD(p,4,2)==(black|crown)) &&
                    LWBOARD(p,5,3)==empty && LWBOARD(p,3,1)==empty && LWBOARD(p,2,0)==empty &&
                    (LWBOARD(p,0,-2)==man || LWBOARD(p,0,-2)==crown || LWBOARD(p,0,-2)==invalid) 
                ) {
                    i1=mapTo4[LWBOARD(p,7,1)];
                    i2=mapTo4[LWBOARD(p,6,2)];
                    i3=mapTo4[LWBOARD(p,3,5)];
                    i4=mapTo4[LWBOARD(p,4,4)];
                    i5=mapTo4[LWBOARD(p,7,5)];
                    i6=mapTo4[LWBOARD(p,6,4)];
                    /*printf("%i %i %i %i %i %i %i\n",i1,i2,i3,i4,i5,i6,takeback[i1][i2][i3][i4][i5][i6]);*/
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        /*printf("s\n");*/
                        setMove(cdepth,color,p,p-6);
                        return(true);
                    }
                }
                /* pattern
           *     ??      ??
           *       ??  ??
           *         ..
           *       bb  bb
           *     ??  ..  ..
           *       wb  ww
           *         ww  .
           *       ws      .
                 */
                if (
                    ((bmPattern[ip].p1 & PAT3)!=0) &&
                    l!=empty && local[p-13]==(black|man) &&
                    LWBOARD(p,-1,3)==empty && !(local[p+7]==man && local[p+14]==empty)
                ) {
                    i1=mapTo4[LWBOARD(p,-3,1)];
                    i2=mapTo4[empty];
                    i3=mapTo4[LWBOARD(p,1,5)];
                    i4=mapTo4[LWBOARD(p,0,4)];
                    i5=mapTo4[LWBOARD(p,-3,5)];
                    i6=mapTo4[LWBOARD(p,-2,4)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        /*dprint("%i %i %i %i %i %i \n",i1,i2,i3,i4,i5,i6);*/
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                        return(true);
                    }
                }
                /* mirror */
                if (
                    ((bmPattern[ip].p1 & PAT4)!=0) &&
                    l!=empty && local[p-13]==(black|man) &&
                    LWBOARD(p,1,3)==empty && !(local[p+6]==man && local[p+12]==empty)
                ) {
                    i1=mapTo4[LWBOARD(p,3,1)];
                    i2=mapTo4[empty];
                    i3=mapTo4[LWBOARD(p,-1,5)];
                    i4=mapTo4[LWBOARD(p,0,4)];
                    i5=mapTo4[LWBOARD(p,3,5)];
                    i6=mapTo4[LWBOARD(p,2,4)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0) {
                        /*dprint("%i %i %i %i %i %i \n",i1,i2,i3,i4,i5,i6);*/
                        pat_found++;
                        setMove(cdepth,color,p,p-6);
                        return(true);
                    }
                }
                /* pattern:
             *  bb  w.
             *    ..  ..      ??            
             *  ??  ww  bb  ??
             *    ww  ??  ..
             *  ws      ??  ??
             *        ??      ??
                */
                if (
                    ((bmPattern[ip].p1 & PAT3)!=0) &&
                    (r==(black|man) || r==(black|crown)) &&
                    (local[p-13]==man || local[p-13]==crown || local[p-13]==empty || (local[p-13]!=empty && local[p-1]!=empty)) &&
                    LWBOARD(p,3,-1)==empty
                ) {
                    i1=mapTo4[LWBOARD(p,5,1)];
                    i2=mapTo4[LWBOARD(p,4,0)];
                    i3=mapTo4[LWBOARD(p,1,-3)];
                    i4=mapTo4[LWBOARD(p,2,-2)];
                    i5=mapTo4[LWBOARD(p,5,-3)];
                    i6=mapTo4[LWBOARD(p,4,-2)];
                    /*if ((bmPattern[ip].p1 & PAT3)==0) {
                        if (color==white) {
                            printf("%i\n",ip);
                            display_board();
                            scanf("%i\n",&i1);
                        }
                    }*/
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                        return(true);
                    }
                }
                /* mirror */
                //printf("%i %i %i\n",p,local[p-13],local[+1]);
                if (
                    ((bmPattern[ip].p1 & PAT4)!=0) &&
                    (l==(black|man) || l==(black|crown)) &&
                    (local[p-13]==man || local[p-13]==crown || local[p-13]==empty || (local[p-13]!=empty && local[p+1]!=empty)) &&
                    LWBOARD(p,-3,-1)==empty
                ) {    
                    i1=mapTo4[LWBOARD(p,-5,1)];
                    i2=mapTo4[LWBOARD(p,-4,0)];
                    i3=mapTo4[LWBOARD(p,-1,-3)];
                    i4=mapTo4[LWBOARD(p,-2,-2)];
                    i5=mapTo4[LWBOARD(p,-5,-3)];
                    i6=mapTo4[LWBOARD(p,-4,-2)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        setMove(cdepth,color,p,p-6);
                        return(true);
                    }
                }
                /* pattern:
             *            w.  bb
             *  ??      ..  ..
             *    ??  bb  ..  ww
             *      ..  ??  ww
             *    ??  ??      ws  
             *  ??        
                */
                if (
                    ((bmPattern[ip].p1 & PAT1)!=0) &&
                    (b==man || b==crown || b==invalid) &&
                    l==empty &&
                    LWBOARD(p,-3,1)==empty &&
                    (LWBOARD(p,-4,0)==(black|man) || LWBOARD(p,-4,0)==(black|crown)) &
                    LWBOARD(p,-5,-1)==empty
                ) {
                    i1=mapTo4[LWBOARD(p,-3,-3)];
                    i2=mapTo4[LWBOARD(p,-4,-2)];
                    i3=mapTo4[LWBOARD(p,-7,1)];
                    i4=mapTo4[LWBOARD(p,-6,0)];
                    i5=mapTo4[LWBOARD(p,-7,-3)];
                    i6=mapTo4[LWBOARD(p,-6,-2)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                        return(true);
                    } 
                }                
                /* mirror */
                if (
                    ((bmPattern[ip].p1 & PAT2)!=0) &&
                    (b==man || b==crown || b==invalid) &&
                    r==empty &&
                    LWBOARD(p,3,1)==empty &&
                    (LWBOARD(p,4,0)==(black|man) || LWBOARD(p,4,0)==(black|crown)) &
                    LWBOARD(p,5,-1)==empty
                ) {
                    i1=mapTo4[LWBOARD(p,3,-3)];
                    i2=mapTo4[LWBOARD(p,4,-2)];
                    i3=mapTo4[LWBOARD(p,7,1)];
                    i4=mapTo4[LWBOARD(p,6,0)];
                    i5=mapTo4[LWBOARD(p,7,-3)];
                    i6=mapTo4[LWBOARD(p,6,-2)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        setMove(cdepth,color,p,p-6);
                        return(true);
                    } 
                }
                /* pattern:
             *      ??      ??
             *        ??  ??
             *          ..
             *    bb  bb  ??
             *      ..  ??  ?? 
             *    wb  ww  
             *  .?  ??  ww
             *    ??      ws   
                */
                /*if (p==54) printf("%i\n%i\n%i\n%i\n%i\n%i\n%i\n%",fl,ffl,br,bbr,f,l,LWBOARD(p,1,3));*/
                    
                if (
                    ((bmPattern[ip].p1 & PAT5)!=0) &&
                    (l!=empty && l!=invalid)
                ) {
                    if (LWBOARD(p,1,3)==empty) {
                        i1=mapTo4[LWBOARD(p,-1,5)];
                        i2=mapTo4[LWBOARD(p,0,4)];
                        i3=mapTo4[LWBOARD(p,3,1)];
                        i4=mapTo4[LWBOARD(p,2,2)];
                        i5=mapTo4[LWBOARD(p,3,5)];
                        i6=mapTo4[LWBOARD(p,2,4)];
                        if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                            pat_found++;
                            setMove(cdepth,color,p,p-7);
                            return(true);
                        }
                    }
                    if (l==(black|man) || l==(black|crown) && LWBOARD(p,-3,-1)==empty) {
                        i1=mapTo4[LWBOARD(p,-1,-3)];
                        i2=mapTo4[LWBOARD(p,-2,-2)];
                        i3=mapTo4[LWBOARD(p,-5,1)];
                        i4=mapTo4[LWBOARD(p,-4,0)];
                        i5=mapTo4[LWBOARD(p,-5,-3)];
                        i6=mapTo4[LWBOARD(p,-4,-2)];
                        if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                            pat_found++;
                            setMove(cdepth,color,p,p-7);
                            return(true);
                        }
                    }
                }                
                /* mirror */
                if (
                    ((bmPattern[ip].p1 & PAT6)!=0) &&
                    (r!=empty && r!=invalid) 
                ) {
                    if (LWBOARD(p,-1,3)==empty) {
                        i1=mapTo4[LWBOARD(p,1,5)];
                        i2=mapTo4[LWBOARD(p,0,4)];
                        i3=mapTo4[LWBOARD(p,-3,1)];
                        i4=mapTo4[LWBOARD(p,-2,2)];
                        i5=mapTo4[LWBOARD(p,-3,5)];
                        i6=mapTo4[LWBOARD(p,-2,4)];
                        if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                            pat_found++;
                            setMove(cdepth,color,p,p-6);
                            return(true);
                        }
                    }
                    if (r==(black|man) || r==(black|crown) && LWBOARD(p,3,-1)==empty) {
                        i1=mapTo4[LWBOARD(p,1,-3)];
                        i2=mapTo4[LWBOARD(p,2,-2)];
                        i3=mapTo4[LWBOARD(p,5,1)];
                        i4=mapTo4[LWBOARD(p,4,0)];
                        i5=mapTo4[LWBOARD(p,5,-3)];
                        i6=mapTo4[LWBOARD(p,4,-2)];
                        if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                            pat_found++;
                            setMove(cdepth,color,p,p-6);
                            return(true);
                        }
                    }
                }                
                
                /*
              *       ??      ??
              *         ??  ??
              *           ..
              * bb  w.  bb  ??
              *   ..  ..      ??
              * ??  ww  
              *   ww  ??
              * ws      ??
               */
                if (
                    ((bmPattern[ip].p1 & PAT7)!=0) &&
                    LWBOARD(p,3,3)==empty
                ) {
                    i1=mapTo4[LWBOARD(p,1,5)];
                    i2=mapTo4[LWBOARD(p,2,4)];
                    i3=mapTo4[LWBOARD(p,4,1)];
                    i4=mapTo4[LWBOARD(p,4,2)];
                    i5=mapTo4[LWBOARD(p,5,5)];
                    i6=mapTo4[LWBOARD(p,4,4)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        setMove(cdepth,color,p,p-7);
                        return(true);
                    }
                }                
                /* mirror */
                if (
                    ((bmPattern[ip].p1 & PAT8)!=0) &&
                    LWBOARD(p,-3,3)==empty
                ) {
                    i1=mapTo4[LWBOARD(p,-1,5)];
                    i2=mapTo4[LWBOARD(p,-2,4)];
                    i3=mapTo4[LWBOARD(p,-4,1)];
                    i4=mapTo4[LWBOARD(p,-4,2)];
                    i5=mapTo4[LWBOARD(p,-5,5)];
                    i6=mapTo4[LWBOARD(p,-4,4)];
                    if (takeback[i1][i2][i3][i4][i5][i6]==0 ) {
                        pat_found++;
                        setMove(cdepth,color,p,p-6);
                        return(true);
                    }
                }                
                    
                if (ecrown>0) {
                    /* pattern: catch enemy crown 
              *     BB  ??   ??
              *       ..  ??
              *     ??  ww  ??
              *       ??  ww
              *     ??  ??  ws        
                    */
                    if ((bmPattern[ip].p1 & PAT9)!=0 ) {
                        int rayHasCrown=false;
                        pt=p;
                        do {
                            pt=next[0][pt][forleft];
                            if (pt==invalid) break;
                            if (local[pt]!=empty) {
                                if (local[pt]==(black|crown)) {
                                    rayHasCrown=true;
                                }
                                break;
                            }
                        } while (true);
                        if (rayHasCrown==true) {
                            pat_found++;
                            setMove(cdepth,color,p,p-7);
                            return(true);
                        }
                    }
                    if ((bmPattern[ip].p1 & PAT10)!=0) {
                        int rayHasCrown=false;
                        pt=p;
                        do {
                            pt=next[0][pt][forright];
                            if (pt==invalid) break;
                            if (local[pt]!=empty) {
                                if (local[pt]==(black|crown)) {
                                    rayHasCrown=true;
                                }
                                break;
                            }
                        } while (true);
                        if (rayHasCrown==true) {
                            pat_found++;
                            setMove(cdepth,color,p,p-6);
                            return(true);
                        }
                    }
                    /* pattern: catch enemy crown 
              *     ??  ??   ws
              *       ??  ww
              *     ..  ..  ??
              *       ..  ??
              *     BB  ww  ??        
                    */
                    if ((bmPattern[ip].p1 & PAT11)!=0) {
                        if (local[p+19] == man && local[p+5]==empty) {
                            int rayHasCrown=false;
                            pt=p;
                            do {
                                pt=next[0][pt][backleft];
                                if (pt==invalid) break;
                                if (local[pt]!=empty) {
                                    if (local[pt]==(black|crown)) {
                                        rayHasCrown=true;
                                    }
                                    break;
                                }
                            } while (true);
                            if (rayHasCrown==true) {
                                pat_found++;
                                setMove(cdepth,color,p+19,p+12);
                                return(true);
                            }
                        }
                    }
                    /* mirror */
                    if ((bmPattern[ip].p1 & PAT12)!=0) {
                        if (local[p+20] == man && local[p+8]==0) {
                            int rayHasCrown=false;
                            pt=p;
                            do {
                                pt=next[0][pt][backright];
                                if (pt==invalid) break;
                                if (local[pt]!=empty) {
                                    if (local[pt]==(black|crown)) {
                                        rayHasCrown=true;
                                    }
                                    break;
                                }
                            } while (true);
                            if (rayHasCrown==true) {
                                pat_found++;
                                setMove(cdepth,color,p+20,p+14);
                                return(true);
                            }
                        }
                    }
                    /* pattern: catch enemy crown 
               *    ??  ..  ??
               *      ..  ww
               *    BB  ww  ..
               *      ??  ??  ww
               *        ??  ??  ws
                    */
                    if ((bmPattern[ip].p1 & PAT13)!=0) {
                        if (local[p-1]==empty && (LWBOARD(p,3,-3)==(white|man) || LWBOARD(p,3,-3)==invalid || LWBOARD(p,3,-3)==(white|crown))) {
                            int rayHasCrown=false;
                            pt=p-7;
                            do {
                                pt=next[0][pt][backleft];
                                if (pt==invalid) break;
                                if (local[pt]!=empty) {
                                    if (local[pt]==(black|crown)) {
                                        rayHasCrown=true;
                                    }
                                    break;
                                }
                            } while (true);
                            if (rayHasCrown==true) {
                                
                                pat_found++;
                                setMove(cdepth,color,p+6,p-1);
                                return(true);
                            }
                        }
                    } /* endif pat13 */
                    /* mirror */
                    if ((bmPattern[ip].p1 & PAT14)!=0) {
                        if (local[p-1]==empty && (LWBOARD(p,-3,-3)==(white|man) || LWBOARD(p,-3,-3)==invalid || LWBOARD(p,-3,-3)==(white|crown))) {
                            int rayHasCrown=false;
                            pt=p-6;
                            do {
                                pt=next[0][pt][backright];
                                if (pt==invalid) break;
                                if (local[pt]!=empty) {
                                    if (local[pt]==(black|crown)) {
                                        rayHasCrown=true;
                                    }
                                    break;
                                }
                            } while (true);
                            if (rayHasCrown==true) {
                                
                                pat_found++;
                                setMove(cdepth,color,p+7,p+1);
                                return(true);
                            }
                        }
                    } /* endif pat14 */
                }
            }
        }
    }
    return(false);
}

void initDetectPatterns(void)
{
    int i;
    int pattern;
    char pat[100];
    int p,spr;
    int v,dp;
    int include;
    FILE *in;
    for (i=0;i<50;i++) for (p=0;p<50;p++) for (v=0;v<8;v++) bmFilter[i][p][v].p1=0;
    
    for (i=0;i<50;i++) {
        bmPatternInit[i].p1=0;
        bmPatternInit[i].p2=0;
    }

    in=fopen("patterns.txt","r");
    if (in==NULL) {
        dprint("FATAL: patterns.txt not found\n");
        exit(1);
    }
    for (pattern=0;pattern<32;pattern++) {
        fscanf(in,"%s\n",pat);
        for (i=0;i<50;i++) {
            /*if (i==34) printf("xx1 %x\n",bmPatternInit[i].p1);*/
            bmPatternInit[i].p1=bmPatternInit[i].p1 | (1<<pattern);
            /*if (i==34) printf("xx2 %x\n",bmPatternInit[i].p1);*/
            for(dp=0;dp<9;dp++) {
                if (dp==0) spr=-7;
                if (dp==1) spr=-6;
                if (dp==2) spr=+6;
                if (dp==3) spr=+7;
                if (dp==4) spr=+12;
                if (dp==5) spr=+14;
                if (dp==6) spr=-12;
                if (dp==7) spr=-13;
                if (dp==8) spr=-14;
                p=invmap[map[i]+spr];
                /*if (i==34) printf("xx3 %x\n",bmPatternInit[i].p1);*/
                if (p<0) {
                    if (pat[dp*7+1]=='0') {
                        bmPatternInit[i].p1 &=  (-1-(1<<pattern));
                        /*if (i==34 ) printf("%x\n",bmPatternInit[i].p1);*/
                        
                    }
                } else {
                    for (v=0;v<6;v++) {
                        include=0;
                        if (v==0 && pat[dp*7+0]=='1') include=1;
                        if (v==2 && pat[dp*7+2]=='1') include=1;
                        if (v==3 && pat[dp*7+3]=='1') include=1;
                        if (v==4 && pat[dp*7+4]=='1') include=1;
                        if (v==5 && pat[dp*7+5]=='1') include=1;
                        bmFilter[i][p][v].p1=bmFilter[i][p][v].p1 | (include<<pattern);
                    }
                }
                /*if (i==34) printf("xx4 %x\n",bmPatternInit[i].p1);*/
            }
        }
        
    }
    printf("ww %x",bmPatternInit[34].p1);
    fclose(in);
}

void detectPatterns(BTYPE *local)
{
    int i;
    int p;
    int p1,p2;
        
    for (i=5;i<50;i++) {
        if (local[map[i]]==(white|man)) {
            p1=bmPatternInit[i].p1;
            //p2=bmPatternInit[i].p2;
            
            p=invmap[map[i]+7];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]+7]].p1;
             //   p2 &= bmFilter[i][p][local[map[i]+7]].p2;
            }
            p=invmap[map[i]+6];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]+6]].p1;
               // p2 &= bmFilter[i][p][local[map[i]+6]].p2;
            }
            p=invmap[map[i]-7];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]-7]].p1;
            //    p2 &= bmFilter[i][p][local[map[i]-7]].p2;
            }
            p=invmap[map[i]-6];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]-6]].p1;
            //    p2 &= bmFilter[i][p][local[map[i]-6]].p2;
            }
            p=invmap[map[i]+14];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]+14]].p1;
              //  p2 &= bmFilter[i][p][local[map[i]+14]].p2;
            }
            p=invmap[map[i]+12];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]+12]].p1;
            //    p2 &= bmFilter[i][p][local[map[i]+12]].p2;
            }
            p=invmap[map[i]-12];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]-12]].p1;
            //    p2 &= bmFilter[i][p][local[map[i]-12]].p2;
            }
            p=invmap[map[i]-14];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]-14]].p1;
            //    p2 &= bmFilter[i][p][local[map[i]-14]].p2;
            }
            p=invmap[map[i]-13];
            if (p>=0) {
                p1 &= bmFilter[i][p][local[map[i]-13]].p1;
             //   p2 &= bmFilter[i][p][local[map[i]-13]].p2;
            }
            bmPattern[i].p1=p1;
           // bmPattern[i].p2=p2;
            /*printf("%i %i\n",i,p1 & 15);*/
        }
    }
}







