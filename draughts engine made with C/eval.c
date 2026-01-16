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

#include <stdio.h>
#include "var.h"
#include "functions.h"
#include <math.h>


#ifdef DEBUG
    #define D(a,b) dprint("debug:%i  %s %i\n",c,a,b)
#else
    #define D(a,b) /**/
#endif
//#define D(a,b) dprint("debug:%i  %s %i\n",c,a,b)
int mobility_eval[40]={-100,-30,-22,-16,-12,-8,-4,0,4,7,10,13,16,18,20,22,24,25,26,27,28,29,30,31,32};

int near_promo[22]={500,1700,1555,1220,1195,1190,425,410,395,380,365,350,335,320,305,290,275,260,245,230,215,200};

int positional[50]={
                       0,   0,   0,   0,   0,
                       50,  30,  30,  30,  30,
                       6,   4,   4,   4,  12,
                       11,   8,   8,   8,   8,
                       7,  17,  44,  17,  38,
                       6,  15,  44,  15,   6,
                       5,  10,  10,   5,   5,
                       -3,   3,   3,   3,   3,
                       1,   1,   1,   1,   1,
                       12,   0,   7,   0,   0
                   };

int column[50]={
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
                   0,   1,   2,   3,   4,
               };
int cscore[5][5]={
                     0, -20, -30, -32, -34,
                     20,   0,  -6, -14, -22,
                     30,   6,   0,  -3,  -8,
                     32,  14,   3,   0,  -1,
                     34,  22,   8,   1,   0
                 };

int crown_positional[50]={
                             0,   0,   0,   0,  25,
                             1,   1,   1,   1,  24,
                             3,   3,   3,  25,   3,
                             6,   6,   6,  28,   6,
                             9,  11,  30,  11,   9,
                             14,  16,  32,  16,  14,
                             18,  35,  20,  18, 18,
                             22,  36,  24,  24,  22,
                             36,  28,  28,  28,  26,
                             42,  31,  31,  31,  31
                         };

int position_fields[5][50]={
                               0,   0,   0,   0,   0,
                               140,  30,  30,  30,  30,
                               16,  14,  14,  14,  78,
                               11,  28,  28,  28,  38,
                               7,  47,  54,  37,  68,
                               16,  35,  44,  35,  36,
                               5,  10,  10,   5,   5,
                               -2,   3,   3,   3,   3,
                               1,   1,   1,   1,   1,
                               10,   0,  12,   0,   0,


                               0,   0,   0,   0,   0,
                               80,  80,  80,  80,  80,
                               61,  61,  61,  61,  61,
                               38,  38,  38,  38,  38,
                               24,  24,  24,  24,  24,
                               16,  16,  16,  16,  16,
                               6,   6,   6,   6,   6,
                               2,   2,   2,   2,   2,
                               1,   1,   1,   1,   1,
                               0,   0,   0,   0,   0,


                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   9,
                               0,   0,   0,   9,   9,
                               0,   0,   0,   9,   9,
                               0,   0,   9,   9,   9,
                               0,   0,   0,   0,   9,
                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   0,

                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   0,
                               9,   0,   0,   0,   0,
                               9,   9,   0,   0,   0,
                               9,   9,   0,   0,   0,
                               9,   9,   0,   0,   0,
                               9,   9,   0,   0,   0,
                               0,   0,   0,   0,   0,
                               0,   0,   0,   0,   0,

                                 0,   0,   0,   0,   0,
                               0,   1,   1,   1,   0,
                                 0,   1,   1,   1,   0,
                               0,   1,   1,   1,   0,
                                 0,   1,   1,   1,   0,
                               0,   1,   1,   1,   0,
                                 0,   1,   1,   1,   0,
                               0,   1,   1,   1,   0,
                                 0,   1,   1,   1,   0,
                               0,   1,   1,   1,   0

                           };

int counter[50]={
                    0,   0,   0,   0,   0,
                    0,   0,   0,   0,   0,
                    0,   0,   0,   0,   0,
                    0,   0,   0,   0,   0,
                    0,   0,   0,   0,   0,
                    0,   0,   0,   0,   0,
                    1,   1,   3,   2,   2,
                    1,   1,   3,   3,   2,
                    1,   3,   3,   2,   2,
                    1,   1,   3,   3,   2
                };

int isedge[50]={
                   0,   0,   0,   0,   1,
                   1,   0,   0,   0,   0,
                   0,   0,   0,   0,   1,
                   1,   0,   0,   0,   0,
                   0,   0,   0,   0,   1,
                   1,   0,   0,   0,   0,
                   0,   0,   0,   0,   1,
                   1,   0,   0,   0,   0,
                   0,   0,   0,   0,   1,
                   1,   0,   0,   0,   0
               };

int crown_only[6][6]={
                         0,    0,    0,    0,     0,      0,
                         0,    0,  -10,  -15, -12000,-18000,
                         0,   10,    0,  -11,   -20, -11000,
                         0,   15,   11,    0,   -12,    -25,
                         0,12000,   20,   12,     0,    -13,
                         0,18000,11000,   25,    13,      0
                     };

int man_only[6][6]={
                       0,    0,    0,    0,     0,      0,
                       0,    0, -330, -720, -3500,  -4500,
                       0,  300,    0, -520, -1500,  -3000,
                       0,  700,  500,    0,  -700,  -2000,
                       0, 3500, 1500,  700,     0,   -900,
                       0, 4500, 3000, 2000,   900,      0
                   };

int pattern[49][8];
int pattern_type[49];
short pat_value[918];

void set_eval()
{
    int totalman,i;

    totalman=pieces[white|man]+pieces[black|man]+pieces[white|crown]+pieces[black|crown];
    if (totalman>=0 && totalman<=14) {
        stage=0;
        for(i=1;i<100;i++) parameters[i]=param_c[i];
        /*if (eval_type==1) {
            parameters[1]=16;
            parameters[2]=8;
            parameters[3]=16;
            parameters[4]=4;
        }*/
    }
    else if (totalman>=15 && totalman<=28) {
        stage=1;
        for(i=1;i<100;i++) parameters[i]=param_b[i];
    }
    else if (totalman>=29 && totalman<=40) {
        stage=2;
        for(i=1;i<100;i++) parameters[i]=param_a[i];
    }
    else printf("uhhh\n");
    set_position(parameters[13],parameters[14]);
    inDatabases=false;
    //if (databaseIsLoaded(pieces[black|man],pieces[black|crown],pieces[white|man],pieces[white|crown],0,0)==true) inDatabases=true;
    //if (databaseIsLoaded(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],0,0)==true) inDatabases=true;
    if (theoretic(white)!=UNKNOWN || theoretic(black)!=UNKNOWN) inDatabases=true;
    if (inDatabases==true) {
        int wsm,bsm;
        
        wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
        bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
        ignoreDB1=database_nr(0,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
        ignoreDB2=database_nr(0,pieces[black|man],pieces[black|crown],pieces[white|man],pieces[white|crown],bsm,wsm);
    }
    
    startMan=pieces[game_color|man];
}


int eval_colunm(int color)
{
    int q,i,score=0,ip,p,cw[5],cb[5];

    cw[0]=cw[1]=cw[2]=cw[3]=cw[4]=cb[0]=cb[1]=cb[2]=cb[3]=cb[4]=0;
    for(ip=0;ip<50;ip++) {
        q=board[map[ip]];
        if (q==(white|man) || q==(white|crown)) cw[column[ip]]++;
        else if (q==(black|man) || q==(black|crown)) cb[column[ip]]++;
    }
    for(i=0;i<5;i++) {
        if (cw[i]>4) cw[i]=4;
        if (cb[i]>4) cb[i]=4;
        if (i==0 || i==4) score+=5*cscore[cw[i]][cb[i]]/4;
        else score+=cscore[cw[i]][cb[i]];
    }
    ;
    if (color==white) return(score);
    return(-score);
}


void set_position(int a,int b)
{
    int i;

    for(i=0;i<50;i++) {
        positional[i]=(a*position_fields[0][i]+b*position_fields[1][i])/64;
    }
}

int handle_pattern(int command,char *local,int color)
{
    int i,pat,j,s,locpat,score=0;

    for(i=0;i<49;i++) {
        pat=0;
        for(j=0;j<8;j++) {
            s=local[pattern[i][j]];
            if (s==empty) locpat=0;
            else if (s==(color|man) || s==(color|crown)) locpat=1;
            else locpat=2;
            pat=3*pat+locpat;
        }
        pat=pattern_type[i]*6561+pat;
        if (command==0) score+=pat_value[pat];
        else if (command==3) printf("pattern %i located\n",pat);
    else if (command==1) {pat_value[pat]+=3;}
        else if (command==2) {pat_value[pat]-=3;}
        else if (command==4) {pattern_use[i]=pat;}
    }
    if (color==white) return(score);
    else return(-score);
}

void init_patterns(void)
{
    int p,pat,y,x,i,u;

    p=0; pat=0;
    for(y=0;y<10;y++) for(x=0;x<10;x++) {
            u=(y+x)%2-y%2;

            if (x<7 && y<7) {
                pattern[pat][0]=p+0; pattern[pat][1]=p+1;
                pattern[pat][2]=p+5+u; pattern[pat][3]=p+6+u;
                pattern[pat][4]=p+10; pattern[pat][5]=p+11;
                pattern[pat][6]=p+15+u; pattern[pat][7]=p+16+u;
                pattern_type[pat]=(x+y)%2;
                if (x==0 && y==0) pattern_type[pat]=0;
                else if (x==6 && y==0) pattern_type[pat]=1;
                else if (x==0 && y==6) pattern_type[pat]=2;
                else if (x==6 && y==6) pattern_type[pat]=3;
                else if (x==0) pattern_type[pat]=4+(x+y)%2;
                else if (y==0) pattern_type[pat]=6+(x+y)%2;
                else if (x==6) pattern_type[pat]=8+(x+y)%2;
                else if (y==6) pattern_type[pat]=10+(x+y)%2;
                else pattern_type[pat]=12+(x+y)%2;
                pat++;
            }
            if ((x+y)%2==1) p++;
        }
    for(i=0;i<49;i++) {
        for(p=0;p<50;p++) board[p]=empty;
        for(p=0;p<8;p++) board[pattern[i][p]]=white|man;
        /*printf("\npattern type:%i\n",pattern_type[i]);
        display_board();*/
    }
    for(i=0;i<918;i++) pat_value[i]=0;
}

void print_pattern_stats(void)
{
    int i;

    for(i=0;i<91854;i++) if (pat_value[i]!=0)
            printf("pattern:%i  value:%i\n",i,pat_value[i]);
}

void save_pattern_stats(void)
{
    FILE *out;
    int i;

    out=fopen("patterns","w");
    if (out==NULL) {
        printf("failure\n");
        return;
    }
    for(i=0;i<91854;i++) if (pat_value[i]!=0)
            fprintf(out,"%i %i\n",i,pat_value[i]);
    fclose(out);
}

void load_pattern_stats(void)
{
    FILE *in;
    int index,value,plus,minus;

    in=fopen("patterns","r");
    if (in==NULL) {
        printf("read pattern failure\n");
        return;
    }
    while(!feof(in)) {
        fscanf(in,"%i %i\n",&index,&value);
        pat_value[index]=value;
    }
    fclose(in);
}

void reverse_xray(void)
{
    int i,t,q1,q2;

    for(i=0;i<50;i++) {
        q1=map[i];
        q2=map[49-i];
        t=xray_w[q1];
        xray_w[q1]=xray_b[q2];
        xray_b[q2]=t;
    }
}

void set_xray(BTYPE *local)
{
    int i,p,ip;
    int x,y;

    /*for(i=0;i<93;i++) xray_w[i]=xray_b[i]=0;*/
    for(ip=49;ip>=0;ip--) {
        p=map[ip];
        if (local[p]==(white|man)) xray_w[p]=1; else xray_w[p]=0;
        xray_w[p]+=xray_w[p+7]+xray_w[p+6];
        if (isedge[ip]==0) xray_w[p]-=xray_w[p+13];
    }
    for(ip=0;ip<50;ip++) {
        p=map[ip];
        if (local[p]==(black|man)) xray_b[p]=1; else xray_b[p]=0;
        xray_b[p]+=xray_b[p-7]+xray_b[p-6];
        if (isedge[ip]==0) xray_b[p]-=xray_b[p-13];
    }
    /* subtract 1 if field is occupied */
    for(ip=0;ip<50;ip++) {
        p=map[ip];
        if (local[p]==(white|man)) xray_w[p]--;
        if (local[p]==(black|man)) xray_b[p]--;
    }
    /*  p=0;
      for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
          if ((x+y)%2==0) printf("  ");
          else {
    	printf("%2i",xray_w[map[p]]);
    	p++;
          }
        }
        printf("\n");
      }*/
}

void print_xray(int color)
{
    int p,x,y,v;
    set_xray(board);
    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) {
                printf("  ");
            }
            else {
                if (color==white) v=xray_w[map[p]];
                if (color==black) v=xray_b[map[p]];
                if (v<10) printf("0");
                printf("%i",v);
                p++;
            }
        }
       printf("\n");
    }
}

int theoretic(int color)
/* tries to determen the game-theoretic value of the board position, without
   searching.
   Returns one of the following:
   WIN/DRAW/LOSE/UNKNOWN
*/
{
    int p,eval;
    int wman=0,bman=0,wcrown=0,bcrown=0;

    /*if (eval_type==1) return(UNKNOWN);*/
    wman=pieces[white|man]; bman=pieces[black|man];
    wcrown=pieces[white|crown]; bcrown=pieces[black|crown];

    if (color==white && (wman+wcrown)==0) return(LOSE);
    if (color==black && (bman+bcrown)==0) return(LOSE);

    if (wman+wcrown+bman+bcrown<8 && use_db==true) {
        eval=database_valueWDL(color,wman,wcrown,bman,bcrown);
        if (eval!=UNKNOWN) {
            if (color==white) return(eval);
            else return(-eval);
        }
    }

    if (color==white && wman==1 && wcrown==0) {
        eval=one_man(color);
        if (eval!=UNKNOWN) {nsort++; return(eval);}
    }
    if (color==black && bman==1 && bcrown==0) {
        eval=one_man(color);
        if (eval!=UNKNOWN) {nsort++; return(eval);}
    }

    return(UNKNOWN);
}

int theoreticDTW(int color)
/* tries to determen the distance to win/lose value of the board position, without
   searching.
   
   return value's:
   WIN = won position
   WIN-1 = win in 1 (whole) move
   WIN-2 = win in 2
   etc
   LOSE = Lost position
   LOSE+1 = Lose in 1
   LOSE+2 = Lose in 2
   etc
   0 = draw
   UNKNOWN = position not known
*/
{
    int p,eval;
    int wman=0,bman=0,wcrown=0,bcrown=0;

    if (use_db==false) return(UNKNOWN);
    
    wman=pieces[white|man]; bman=pieces[black|man];
    wcrown=pieces[white|crown]; bcrown=pieces[black|crown];


    if (color==white && (wman+wcrown)==0) return(LOSE);
    if (color==black && (bman+bcrown)==0) return(LOSE);

    if (wman+wcrown+bman+bcrown<8) {
        eval=database_valueDTW(color,wman,wcrown,bman,bcrown);
        if (eval==UNKNOWN) return(UNKNOWN);
        if (eval==DB_DRAW) return(0);
        if ((eval & 1)==0) return(LOSE+(eval >>1));
        return(WIN-((eval+1) >>1));
    }
    return(UNKNOWN);
}

int material(int color)
/* evaluates board for player 'color' in a materialistic way.
   Color is to move. A man is 1000 points.
*/
{
    int wman,bman,wcrown,bcrown,totalman,mat;

    nmat++;
    mat=0;
    wman=pieces[white|man]; bman=pieces[black|man];
    wcrown=pieces[white|crown]; bcrown=pieces[black|crown];
    //dprint("%i %i %i %i\n",wman,wcrown,bman,bcrown);
    
    totalman=wman+wcrown+bman+bcrown;
    if (totalman<7) {
        mat=database_valueWDL(color,wman,wcrown,bman,bcrown);

        if (mat!=UNKNOWN) {
            if (mat==DRAW) return(1);
            if (color==black) return(-mat); else return(mat);
        }
    }
    /* win/lose */
    if ((bman+bcrown)==0) {mat=WIN;goto endmat;}
    if ((wman+wcrown)==0) {mat=LOSE;goto endmat;}

    mat=1000*(wman-bman)+3300*(wcrown-bcrown);

    if ((wman+wcrown)==4 && (bman+bcrown)==1) goto endmat;
    if ((wman+wcrown)==1 && (bman+bcrown)==4) goto endmat;
        
    /* scaling toward draw */
    if (wman==0 && bman==0 && wcrown<6 && bcrown<6)
        mat=crown_only[wcrown][bcrown];
    else if (wcrown>0 && bcrown>0) {
        mat=mat/2; /* crowns on board */
        if ((wman+wcrown)<=3 && (bman+bcrown)<=3) mat/=4; /* drawish ending */
        else if ((wman+wcrown)<=5 && (bman+bcrown)<=5) mat=mat*3/2; /* drawish ending */
    }
endmat:
    if (color==black) mat=-mat;
    return(mat);
}

int one_rb(int p,BTYPE *local)
{
    if (local[p-13]==(black|man) || local[p-13]==(black|crown)) {
        if (local[p-1]==empty) {

            return(LOSE);
        }
    }
    if (local[p-14]==(black|man) || local[p-14]==(black|crown)) {

        return(LOSE);
    }
    if (local[p-1]==(black|man) || local[p-1]==(black|crown))
        if (local[p-13]==empty) {
            return(LOSE);
        }
    if (local[p-26]!=(black|man) && local[p-26]!=(black|crown)) {
        return(UNKNOWN);
    }
    if (local[p-8]==empty && local[p-13]==empty && local[p-14]==empty && local[p-20]==empty) {

        return(LOSE);
    }
    return(UNKNOWN);
}

int one_lb(int p,BTYPE *local)
{

    if (local[p-13]==(black|man) || local[p-13]==(black|crown)) {
        if (local[p+1]==empty) {

            return(LOSE);
        }
    }
    if (local[p-12]==(black|man) || local[p-12]==(black|crown)) {
        return(LOSE);
    }
    if (local[p+1]==(black|man) || local[p+1]==(black|crown))
        if (local[p-13]==empty) {
            return(LOSE);
        }
    if (local[p-26]!=(black|man) && local[p-26]!=(black|crown)) {
        return(UNKNOWN);
    }
    if (local[p-5]==empty && local[p-13]==empty && local[p-12]==empty && local[p-19]==empty) {

        return(LOSE);
    }
    return(UNKNOWN);
}

int one_man(int color)
/* eval: color has only one man return unknown or lose */
/* only call in quiet position */
{
    BTYPE *local;
    BTYPE temp[93],own[93];
    char n=0,pos;
    int x,y,p,ip,i;

    if ((color)==white) local=board;
else {local=temp; reverse_board(local,board);}

    /* find man */
    for(ip=0;ip<50;ip++) {
        p=map[ip];
        if (local[p]==(white|man)) {
            n++;
            pos=p;
        }
    }
    if (n!=1) {
        printf("false one_man\n");
        return(UNKNOWN);
    }
    if (local[pos-6]!=empty && local[pos-7]!=empty) return(UNKNOWN);
    if (local[pos+6]==(black|man) || local[pos+7]==(black|man)) return(UNKNOWN);
    if (local[pos+6]==(black|crown) || local[pos+7]==(black|crown)) return(UNKNOWN);
    if (invmap[pos]==24 || invmap[pos]==34 || invmap[pos]==44) return(one_rb(pos,local));
    if (invmap[pos]==25 || invmap[pos]==35 || invmap[pos]==45) return(one_lb(pos,local));
    /* calc ownership */
    for(p=0;p<93;p++) own[p]=OWN;
    for(ip=0;ip<50;ip++) own[map[ip]]=FREE;
    for(ip=0;ip<50;ip++) {
        p=map[ip];
        if (local[p]==(black|man) || local[p]==(black|crown)) {
            if (local[p+6]==empty && (local[p+12]==empty || local[p+12]==(white|man))) own[p+6]=OWN;
            if (local[p+7]==empty && (local[p+14]==empty || local[p+14]==(white|man))) own[p+7]=OWN;
            if (local[p-6]==empty && local[p-12]==empty) own[p-6]=OWN;
            if (local[p-7]==empty && local[p-14]==empty) own[p-7]=OWN;
        }
    }

#ifdef notdef
    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) printf("  ");
            else {
                switch(own[map[p]]) {
                case FREE:   printf(".."); break;
                case OWN:    printf("ME"); break;

                default: printf("??"); break;
                }
                p++;
            }
        }
        printf("\n");
    }
    printf("%i\n",invmap[pos]);
#endif

    if (own[pos-6]!=FREE && own[pos-7]!=FREE) {
        /*display_board(); printf("lose %i\n",color);*/

        return(LOSE);
    }
    return(UNKNOWN);
}

int xmaterial(int color,int *exact)
/* evaluates board for player 'color' in a materialistic way.
   Color is to move. A man is 1000 points.
*/
{
    int mman,eman,mcrown,ecrown,mat,theo;
    int dbNr;
    int wsm,bsm;
    
    nmat++;
    
    theo=UNKNOWN;
    
    if (inDatabases==true) {
        wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
        bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
        dbNr=database_nr(color,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
        if (ignoreDB1!=dbNr && ignoreDB2!=dbNr) theo=theoretic(color);
    } else {    
        theo=theoretic(color);
    }
    if (theo!=UNKNOWN) {
        *exact=true;
        return(theo);
    }
    if (color==white) {
        mman=pieces[white|man]; eman=pieces[black|man];
        mcrown=pieces[white|crown]; ecrown=pieces[black|crown];
    }
    else {
        eman=pieces[white|man]; mman=pieces[black|man];
        ecrown=pieces[white|crown]; mcrown=pieces[black|crown];
    }

    *exact=false;

    /* crowns only */
    if (mman==0 && eman==0 && ecrown<6 && mcrown<6) { /* crown only */
        return(crown_only[mcrown][ecrown]);
    }
    /* man only */
    if (mman<6 && eman<6 && ecrown==0 && mcrown==0) { /* crown only */
        return(man_only[mman][eman]);
    }

    /* no ending */
    mat=1000*(mman-eman)+3300*(mcrown-ecrown);
    if ((eman+ecrown)==4 && (mman+mcrown)==1) goto endmat;
    if ((eman+ecrown)==1 && (mman+mcrown)==4) goto endmat;

    if ((mman+mcrown)==4 && (eman+ecrown)==2) {
        if (ecrown==0) {
            mat=(300*mcrown+1600);
            goto endmat;
        }
        if (ecrown==1) {
            mat=(300*mcrown+800);
            goto endmat;
        }
    }
    if ((mman+mcrown)==2 && (eman+ecrown)==4) {
        if (mcrown==0) {
            mat=-(300*ecrown+1600);
            goto endmat;
        }
        if (mcrown==1) {
            mat=-(300*ecrown+800);
            goto endmat;
        }
    }

    if (mcrown>0 && ecrown>0) {
        /* crowns on board: move to draw*/
        if ((mman+mcrown)<=3 && (eman+ecrown)<=3) mat/=128; /* drawish ending */
        else if ((mman+mcrown)<=4 && (eman+ecrown)<=4) mat/=4; /* drawish ending */
        else if ((mman+mcrown)<=5 && (eman+ecrown)<=5) mat/=3; /* drawish ending */
        else mat/=2;
    }
endmat:
    return(mat);
}

int mobility_w(BTYPE *local,int *act,int *block)
/* counts the number of legal moves that are not losing directly,
   the number of active moves and determens blocked pieces */
{
    int p,ip,moves=0,b=0;
    int active=0,oldm;
    int al,ar;
    int x,y;

    for(ip=0;ip<50;ip++) {
        p=map[ip];
        blocked[p]=false;
        oldm=moves;
        if (local[p]==man) {
            al=0; ar=0;
            if (local[p-7]==empty) {
                moves++;
                if (local[p-14]==(black|man)) {
                    al=1;
                    /* check weaks */
                    if (local[p+6]==man && local[p+12]==empty) {moves--; al=0; goto scip1;}
                    if (local[p-6]==man && local[p-12]==empty) {moves--; al=0; goto scip1;}
                    if (local[p+7]==man && local[p+14]==empty) {moves--; al=0; goto scip1;}
                    /* no weaks, but is it backed and can we take back */
                    if ((local[p+6]!=man || local[p-6]!=empty) && (local[p-6]!=man || local[p+6]!=empty) && local[p+7]!=man) {moves--; al=0; goto scip1;}
                }
                if (local[p-13]==(black|man) && local[p-1]==empty) {
                    al=1;
                    /* check weaks */
                    if (local[p+6]==man && local[p+13]==empty) {moves--; al=0; goto scip1;}
                    if (local[p-8]==man && local[p-15]==empty) {moves--; al=0; goto scip1;}
                    if (local[p+5]==man && local[p+11]==empty) {moves--; al=0; goto scip1;}
                    /* no weaks, but is it backed? */
                    if ((local[p+6]!=man || local[p-8]!=empty) && (local[p-8]!=man || local[p+6]!=empty) && local[p+5]!=man) {moves--; al=0; goto scip1;}
                }
                if (local[p-1]==(black|man) && local[p-13]==empty) {
                    al=1;
                    if (local[p-6]==man && local[p+1]==empty) {moves--; al=0; goto scip1;}
                    /*if (local[p-8]==man && local[p-15]==empty) {moves--; al=0; goto scip1;}
                    if (local[p+5]==man && local[p+11]==empty) {moves--; al=0; goto scip1;}*/
                    /* no weaks, but is it backed? */
                    if (local[p-6]!=man /*&& local[p-8]!=man && local[p+5]!=man*/) {moves--; al=0; goto scip1;}
                    if (p>=20) if (local[p-6]==man && local[p-20]!=empty) {moves--; al=0; goto scip1;}
                }
                /* pinned? */
                if (local[p-6]==man && local[p-12]==(black|man) && local[p-14]==empty) {moves--; goto scip1;}
            }
scip1:
            if (local[p-6]==empty) {
                moves++;
                if (local[p-12]==(black|man)) {
                    /* check weaks */
                    ar=1;
                    if (local[p+7]==man && local[p+14]==empty) {moves--; ar=0; goto scip2;}
                    if (local[p-7]==man && local[p-14]==empty) {moves--; ar=0; goto scip2;}
                    if (local[p+6]==man && local[p+12]==empty) {moves--; ar=0; goto scip2;}
                    /* no weaks, but is it backed? */
                    if ((local[p+7]!=man || local[p-7]!=empty) && (local[p-7]!=man || local[p+7]!=empty) && local[p+6]!=man) {moves--; ar=0; goto scip2;}
                }
                if (local[p-13]==(black|man) && local[p+1]==empty) {
                    ar=1;
                    /* check weaks */
                    if (local[p+7]==man && local[p+13]==empty) {moves--; ar=0; goto scip2;}
                    if (local[p-5]==man && local[p-11]==empty) {moves--; ar=0; goto scip2;}
                    if (local[p+8]==man && local[p+15]==empty) {moves--; ar=0; goto scip2;}
                    /* no weaks, but is it backed? */
                    if ((local[p+7]!=man || local[p+5]!=empty) && (local[p-5]!=man || local[p+7]!=empty) && local[p+8]!=man) {moves--; ar=0; goto scip2;}
                }
                if (local[p+1]==(black|man) && local[p-13]==empty) {
                    ar=1;
                    if (local[p-7]==man && local[p-1]==empty) {moves--; ar=0; goto scip2;}
                    /* no weaks, but is it backed? */
                    if (local[p-7]!=man) {moves--; ar=0; goto scip2;}
                    if (p>=19) if (local[p-7]==man && local[p-19]!=empty) {moves--; ar=0; goto scip2;}
                }
                /* pinned? */
                if (local[p-7]==man && local[p-14]==(black|man) && local[p-12]==empty) {moves--; goto scip2;}

            }
scip2:

            /* if a piece is blocked by the opponent, direct or indirect,
            we call it blocked */
            if (oldm==moves && (local[p-6]==empty || local[p-6]==(black|man) || local[p-7]==empty || local[p-7]==(black|man) )) { blocked[p]=true; b++;}
            active+=al+ar;
        }
    }

    *act=active;
    for(ip=5;ip<50;ip++) {
        p=map[ip];
        if (blocked[p]==false) {
            if (blocked[p-6]==true && blocked[p-7]==true) { blocked[p]=true; b++;}
        }
    }
    *block=b;
#ifdef notdef
    p=0;printf("\n%i\n",*block);
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) printf("  ");
            else {
                switch(blocked[map[p]]) {
                case false:   printf(".."); break;
                case true:    printf("--"); break;
                }
                p++;
            }
        }
        printf("\n");
    }
#endif
    return(moves);
}

int parity_score(int color)
{
    int ip,pw,pb,p,par,s;

    for(ip=0;ip<5;ip++) {
        p=map[ip];
        if (board[p]==(white|man)) pw++;
        if (board[p]==(black|man)) pb++;
        if (board[p+13]==(white|man)) pw++;
        if (board[p+13]==(black|man)) pb++;
        if (board[p+26]==(white|man)) pw++;
        if (board[p+26]==(black|man)) pb++;
        if (board[p+39]==(white|man)) pw++;
        if (board[p+39]==(black|man)) pb++;
        if (board[p+52]==(white|man)) pw++;
        if (board[p+52]==(black|man)) pb++;
    }
    par=(pw+pb)%2;
    if (par==1) s=1; else s=-1;
    if (pieces[white|man]==5) return(3*s);
    else if (pieces[white|man]==4) return(15*s);
    else if (pieces[white|man]==3) return(30*s);
    else if (pieces[white|man]==2) return(40*s);
    else if (pieces[white|man]==1) return(45*s);
    return(0);
}

int isDefendL(BTYPE* local,int p)
/* returns true if takeback is possible at p, from hit from the left
   black man at p-7
   white can do 1 move
 */
{
    if (local[p]==invalid) return false;
    if (local[p]==(white|man)) {
        if (local[p+7]==(white|man) || local[p+7]==invalid) return true;
        if (local[p+13]==(white|man) || local[p+14]==(white|man)) return true;
    } else if (local[p+6]==(white|man) && local[p+7]==(white|man)) return  true;
    return false;
}
int isDefendR(BTYPE* local,int p)
/* returns true if takeback is possible at p, from hit from the left
   black man at p-7
   white can do 1 move
 */
{
    if (local[p]==invalid) return false;
    if (local[p]==(white|man)) {
        if (local[p+6]==(white|man) || local[p+6]==invalid) return true;
        if (local[p+13]==(white|man) || local[p+12]==(white|man)) return true;
    } else if (local[p+7]==(white|man) && local[p+6]==(white|man)) return  true;
    return false;
}

int evalboard(int color,int alfa,int beta,int *precise)
/* evaluates board for player 'color'. He is to move. A man is 1000 points.
    precise=false if only an estimate was returned
    precise=true if good value was returned
*/
{
    int center,i,p,ip,mat=0,c,totalman,parscore=0,mscore;
    int bbbr,bbbl,fffr,fffl,fl,fr,bl,br,bbl,bbr,ffr,ffl,l,r,f,b;
    int mman,eman,mcrown,ecrown,pat,control=0,dyn=0,eval[2]={0,0},mobil[2];
    static BTYPE temp[93];
    BTYPE *local;
    int exact,pos=0,count[10],nactive[2],nblock[2];
    int largeCenter[2];
    int t1,t2;
#ifdef DEBUG
    int olde,fl0;
#endif
    neval++;
    tneval++;
    
    t1=0; t2=0;
    for(ip=0;ip<50;ip++) {
        if (board[map[ip]]==(white|man)) {
            t1+=ip/5;
        }
        if (board[map[ip]]==(black|man)) {
            t2+=(49-ip)/5;
        }
    }
    /*
    if (pieces[white|man]==3 && pieces[black|man]==3 && pieces[white|crown]==0 && pieces[black|crown]==0) {
        printf("%i %i %i\n",t1,t2,t1-t2+color);
        if (t1-t2+color > 14) {
            display_board();
            printf("\n");
        }
    }*/
    
    *precise=false;
    if (windows==true) {
        if ((tneval & 65535)==0) {
            winprint("\n");
            winprint("PROGRESS|*|*|*|%i|*\n",tneval);
            if (windows==true) {
                /* see if search should be aborted */
                FILE *in;
                in=fopen("com/win.in","r");
                if (in!=NULL) {
                    fclose(in);
                    stopflag=true;
                }
            }
        }
    }
    /* material */
    /*if (tpat_reconize()>=0) dbfail++;*/
    mat=xmaterial(color,&exact);
    if (exact==true) return(mat);
    if (mat<(alfa-1500)) return(mat);
    if (mat>(beta+1500)) return(mat);
    //pos=retreive_eval(color);
    
    //if (pos!=UNKNOWN) return(pos);
    
    //else pos=0;
    pos=0;
    if (color==white) {
        mman=pieces[white|man]; eman=pieces[black|man];
        mcrown=pieces[white|crown]; ecrown=pieces[black|crown];
    }
    else {
        eman=pieces[white|man]; mman=pieces[black|man];
        ecrown=pieces[white|crown]; mcrown=pieces[black|crown];
    }
    totalman=mman+mcrown+eman+ecrown;
    /*    if (mman==4 && mcrown==0 && eman==4 && ecrown==0) new_table_entry(MISC,color,AB,0,0,10);*/
    /* field control/promotion */
        if (totalman<28) if (mcrown==0 && ecrown==0) control=field_control(color); else control=0;

    /* mobility */
    eval[0]=eval[1]=0;
    for(c=0;c<2;c++) { /* c=0: own man are to move, c=1 evaluate enemy */
#ifdef DEBUG
        dprint("color:%i\n",c);
#endif
        largeCenter[c]=0;
        if ((color^c)==white) local=board;
        else {
            local=temp;
            reverse_board(local,board);
        }
        if (c==0) set_xray(local);
        else if (c==1) reverse_xray();

        mobil[c]=mobility_w(local,&nactive[c],&nblock[c]);

        if (mobil[c]<24) mobil[c]=mobility_eval[mobil[c]]; else mobil[c]=32;
        count[0]=count[1]=count[2]=count[3]=0;
#ifdef DEBUG
        fl0=eval[c];
#endif
        for(ip=0;ip<50;ip++) {
#ifdef DEBUG
            olde=eval[c];
#endif
            p=map[ip];
            if (local[p]==crown) eval[c]+=crown_positional[ip];
            if (local[p]==man) {
                /* position score */
                count[counter[ip]]++;
                eval[c]+=positional[ip];
                largeCenter[c]+=position_fields[4][ip];
                
                if (eval_type==99) {
                    if (xray_b[p]==0) eval[c]+=40+2*progress[ip];
                    else if (xray_b[p]==1) eval[c]+=8+2*progress[ip];
                }
                else {
                    if (xray_b[p]==0) eval[c]+=30*progress[ip];
                    else if (xray_b[p]==1) eval[c]+=5*progress[ip];
                    else if (xray_b[p]==2) eval[c]+=3*progress[ip];
                }
                D("1",eval[c]);
                if (board[p-6]==empty) if (xray_b[p-6]==0) eval[c]+=10;
                if (board[p-7]==empty) if (xray_b[p-7]==0) eval[c]+=10;
                D("2",eval[c]);
                fl=local[p-7];/*local[next[white][p][forleft]];*/
                /*printf"%i %i %i %i\n",p,p-7,local[p-7],next[white][p][forleft]);*/
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

                //l=local[next[white][next[white][p][forleft]][backleft]];
                //r=local[next[white][next[white][p][forright]][backright]];
                l=local[p-1];
                r=local[p+1];
                if (ip>=10) f=local[p-13]; else f=invalid;
                if (ip<=39) b=local[p+13]; else b=invalid;

                /* long distance forcing */
            if (xray_w[p+6]==0 && bl==empty && fr==empty && xray_b[p-6]>=2 && xray_w[p-6]<=1 && f==empty) {/*printf("forcing r on %i\n",ip+1);*/ eval[c]-=25-2*progress[ip];}
                if (xray_w[p+7]==0 && br==empty && fl==empty && xray_b[p-7]>=2 && xray_w[p-7]<=1 && f==empty) {/*printf("forcing l on %i\n",ip+1);*/ eval[c]-=25-2*progress[ip];}

                /* open  -----------------    ..  ------------------------*
                 *                      bO  wO                            *
                 *                        ..                              *
                 *                     wO                                 *
                 *                   wO                                   *
                 *--------------------------------------------------------*/
                if (f==(black|man) && bl==(white|man) && fr==empty && ffr==(white|man) && fffr==empty) eval[c]-=parameters[10];
                if (f==(black|man) && br==(white|man) && fl==empty && ffl==(white|man) && fffl==empty) eval[c]-=parameters[10];
                D("3",eval[c]);
                /*--------------------------------------------------------*
                 *                    bO                                  *
                 *                  ..                                    *
                 *                wO                                      *
                 *              wO                                        *
                 *            *?                                          *
                 *--------------------------------------------------------*/
                if ((bbl==invalid || bbl==man) && bl==(white|man) && fr==empty && ffr==(black|man)) eval[c]+=parameters[4];
                if ((bbr==invalid || bbr==man) && br==(white|man) && fl==empty && ffl==(black|man)) eval[c]+=parameters[4];
                D("4",eval[c]);
                /* hek
                                       bO  bO
                                             bO
                                       wO  wO
                                                 wO
                */
#ifdef notdef
                /* ------------------------------    b?      bb   -------*
                 *                 bb      bb          bb  ..  bb        *
                 *                   ..  ww              ..  ww          *
                 *                     ww         &&   ww  ww            *
                 *		     ww  w?                  w?          *
                 *                         .?                  .?        *
                 *-------------------------------------------------------*/
                if (fr==(white|man) && ffr==(black|man) && fl==empty && ffl==(black|man)) {
                    if (bl==(white|man) && l!=(white|man)) eval[c]-=15;
                    if (p>=20) if (l==(white|man) && local[p-20]==(black|man)) eval[c]-=12;
                    if (br==empty) eval[c]-=8;
                    if (bbl==empty) eval[c]-=6;
                }
#endif
                /* connection --------------------------------------------*
                 *                  wO              wO         wO  wO       bb      bb
                 *                wO          &   wO  wO  &      wO           ww  ww
                 *              w?                                              ww 
                 *--------------------------------------------------------*/

                if (bl==(white|man)) {
                    eval[c]+=parameters[1];
                    if (bbl==(white|man)) eval[c]+=parameters[2];
                    if (br==(white|man)) eval[c]+=parameters[3];
                    if (l==(white|man)) {
                        eval[c]+=10;
                        if (fr==(black|man) && LWBOARD(p,-3,1)==(black|man)) {
                            eval[c]-=45;
                        }
                    }
                    /*printf("%i\n",parameters[16]);*/
                }
                D("5",eval[c]);
                if (br==(white|man)) {
                    eval[c]+=parameters[1];
                    if (bbr==(white|man)) eval[c]+=parameters[2];
                }
#ifdef notdef
                /* isolated at edge --------------------------------------*
                 *                     ..  bO                             *
                 *                       ..                               *
                 *                     wO                                 *
                 *                   **                                   *
                 *--------------------------------------------------------*/
                if (fr==empty && f==empty && bl==invalid && ffr==(black|man)) eval[c]-=parameters[7];
                if (fl==empty && f==empty && br==invalid && ffl==(black|man)) eval[c]-=parameters[7];
#endif
                /* double pressure  --------------------------------------*
                 *                   bO  bO                               *
                 *                     wO                                 *
                 *--------------------------------------------------------*/
                if (fl==(black|man) && fr==(black|man)) {
                    eval[c]-=parameters[8];
                    if (l==(black|man) && r==(black|man)) eval[c]-=60;
                    if (bl==empty && br==empty) {
                        if ((bbl==empty || bbl==(black|man) || bbl==invalid) && (bbr==empty || bbr==(black|man) || bbr==invalid) && (b==empty || b==(black|man)) ) {
                            eval[c]-=700;
                        }
                    }
                }
                D("6",eval[c]);
                /* indefensable attack                   
                                bs      b?               
                                  bb  ..                 
                                    ww  b?               
                                      ..                     
                */
                if (fl==(black|man) && fr==empty && br==empty) {
                    if ((ffr==(black|man) || r==(black|man)) && r!=(white|man) && r!=(white|crown)) {
                        if (r==(black|man) && f==empty && (bbr==empty || LWBOARD(p,3,-3)==empty)) {
                            eval[c]-=700;
                        } else if (ffr==(black|man) && (b==empty || b==(black|man)) && bbr==empty && isDefendL(local,p+14)==false && isDefendR(local,p+13)==false) {
                            if (!(bl==(white|man) && (bbl==(white|man) || bbl==invalid))) {
                                eval[c]-=700;
                            }
                        }
                    }
                }
                D("7",eval[c]);
                /* mirror */
                if (fr==(black|man) && fl==empty && bl==empty) {
                    if ((ffl==(black|man) || l==(black|man)) && l!=(white|man) && l!=(white|crown)) {
                        if (l==(black|man) && f==empty && (bbl==empty || LWBOARD(p,-3,-3)==empty)) {
                            eval[c]-=700;
                        } else if (ffl==(black|man) && (b==empty || b==(black|man)) && bbl==empty && isDefendR(local,p+12)==false && isDefendL(local,p+13)==false) {
                            if (!(br==(white|man) && (bbr==(white|man) || bbr==invalid))) {
                                eval[c]-=700;
                            }
                        }
                    }
                }
                D("8",eval[c]);
                /* blocked man -------------------------------------------*
                 *                   **             **  bO                *
                 *                     bO             bO  ..              *
                 *                       wO             wO  ..            *
                 *			               wO              *
                 *				        ..                *
                 *--------------------------------------------------------*
                */
                if (ffl==invalid && fl==(black|man)) {
                    eval[c]-=parameters[11];  /* first option */
                    eval[c]-=30;
                    if (br==man && b==empty && f==(black|man) && fr==empty && r==empty) eval[c]-=parameters[5];
                }
                if (ffr==invalid && fr==(black|man)) {
                    eval[c]-=parameters[11];
                    eval[c]-=30;
                    if (bl==man && b==empty && f==(black|man) && fl==empty && l==empty) eval[c]-=parameters[5];
                }
                D("9",eval[c]);
                /* weak, attacked  --b?---------------------------------*
                 *             w?  bb                                   *
                 *               ww                                     *
                 *             ww                                       *
                 *	     ..		                                *
                 *------------------------------------------------------*/
                if (fr==(black|man) && bl==(white|man) && bbl==empty) {
                    eval[c]-=7;
                    if (fl==(white|man)) eval[c]-=4;
                    if (ffr==(black|man)) eval[c]-=12;
                }
                if (fl==(black|man) && br==(white|man) && bbr==empty) {
                    eval[c]-=7;
                    if (fr==(white|man)) eval[c]-=4;
                    if (ffl==(black|man)) eval[c]-=12;
                }
                D("10",eval[c]);
                /* indefensable attack  -----------  bb  ---------------*
                 *                             bb  ..                   *
                 *          			         ww                     *
                 *		            	       w?  ..                   *
                 *			                 w?	     w?                 *
                 *---------------------------------    w?   ------------*
                */
                if (fl==(black|man) && fr==empty && ffr==(black|man)) {
                    if (  br==empty) {
                        if ((bl==empty || bbl==empty) && (bbr==empty || bbbr==empty)) eval[c]-=parameters[9];
                        if (fr==(black|man) && fl==empty && ffl==(black|man) && bl==empty) {
                            if ((br==empty || bbr==empty) && (bbl==empty || bbbl==empty)) eval[c]-=parameters[9];
                        }
                    }
                    /*          **  bb
                              bb  ..
                            b?  ww
                              ..
                            **    
                    */
                    
                    if (bl==empty ) {
                        eval[c]-=20;
                        if (xray_w[p+12]<=xray_b[p-13]) {
                            eval[c]-=30;
                            if (l==(black|man)) eval[c]-=30;
                        }
                    }
                }
                D("11",eval[c]);
                /* mirror */
                if (fr==(black|man) && fl==empty && ffl==(black|man)  ) {
                    if (br==empty) {
                        eval[c]-=20;
                        //dprint("%i %i\n",xray_w[p+14],xray_b[p-13]);
                        if (xray_w[p+14]<=xray_b[p-13]) {
                            eval[c]-=30;
                            if (r==(black|man)) eval[c]-=30;
                        }
                    }
                }
                D("12",eval[c]);
                /* edge 2
                            bb  
                          ..  **
                        bb  ww
                     ??   ??  **
                   w?   ..  ww  
                */
                if (f==(black|man)) {
                    if (fr==invalid && fl==empty && l==(black|man)) {
                        eval[c]+=40;
                        if (LWBOARD(p,-4,-2)==(white|man) || bbl==(white|man) || b==(white|man)) eval[c]+=40;
                    }
                    if (fl==invalid && fr==empty && r==(black|man)) {
                        eval[c]+=40;
                        if (LWBOARD(p,4,-2)==(white|man) || bbr==(white|man) || b==(white|man)) eval[c]+=40;
                    }
                }    
                D("13",eval[c]);     
                if ( fl==empty && fr==empty) {
                    if (bl==empty && br==empty) {
                        /* isolated man  ---------------------------------------*
                         *                           ??  ??  ??                 *
                         *                             ..  ..                   *
                         *                           ..  ww  ..                 *
                         *                             ..  ..                   *
                         *                           w?  ..  w?                 *
                         *------------------------------------------------------*/
                        if ( l==empty && r==empty && b==empty) {
                            if (bbl==empty || bbr==empty) if (xray_w[p]<xray_b[p]) {
                                if (totalman>28) eval[c]-=200;
                                else if (totalman>23) eval[c]-=100;
                                else if (totalman>18) eval[c]-=50;
                            }
                        }
                        D("14",eval[c]);
                        /* isolated man under attack---------------------------------- 
                         *
                         *         ..  ..             ..  ..
                         *       b?  ww  b?         bb  ww  bb
                         *         ..  ..                 ww
                         *                              ww                      */
                         if (eval_type!=99) {
                             if (l==(black|man) || r==(black|man)) {
                                //if (xray_b[p]>5 && xray_b[p-13]>3) {
                                //dprint("%i %i %i %i\n",xray_b[p],xray_b[p-6],xray_b[p-7],xray_b[p-13]);
                                if (xray_b[p]>=5 && (xray_b[p-6]>=3 || xray_b[p-7]>=3)) {
                                    eval[c]-=231;
                                }
                            }
                        }
                    }
                    D("15",eval[c]);
                        /* ----------------------------------------------------------- 
                         *
                         *                            ..  ..
                         *                          bb  ww  bb
                         *                            ..  ww
                         *                              ww                      */
                    if (l==(black|man) && r==(black|man)) {
                        if (b==(white|man) && ((bl==empty && br==(white|man)) || (br==empty && bl==(white|man)) ) ) {
                            eval[c]-=40;
                        }
                    }
                }
                       D("16",eval[c]);
#ifdef DEBUG
                dprint("field:%i, eval:%i\n",ip+1,eval[c]-olde);
#endif
            }
        }
        /* empty left or right wing */
        if (stage==0) {
            if (count[1]==0) eval[c]-=40;
            else if (count[1]==1) eval[c]-=20;
            else if (count[1]==2) eval[c]-=15;
            else if (count[1]==3) eval[c]-=10;
            if (count[2]==0) eval[c]-=50;
            else if (count[2]==1) eval[c]-=30;
            else if (count[2]==2) eval[c]-=10;
            if (count[3]==0) eval[c]-=40;
            else if (count[3]==1) eval[c]-=30;
            else if (count[3]==2) eval[c]-=10;
        }
        else if (stage==1) {
            if (count[1]==0) eval[c]-=20;
            else if (count[1]==1) eval[c]-=10;
            else if (count[1]==2) eval[c]-=7;
            else if (count[1]==3) eval[c]-=5;
            if (count[2]==0) eval[c]-=25;
            else if (count[2]==1) eval[c]-=15;
            else if (count[2]==2) eval[c]-=5;
            if (count[3]==0) eval[c]-=20;
            else if (count[3]==1) eval[c]-=15;
            else if (count[3]==2) eval[c]-=5;
        }
#ifdef DEBUG
        olde=eval[c];
        dprint("total for floating patterns:%i\n",eval[c]-fl0);
#endif
        /*****************************/
        /* fixed postion evaluations */
        /*****************************/
        /* center occupation */
        center=0;
        if (local[F23]==man) center+=2;
        if (local[F28]==man) center+=2;
        if (local[F32]==man) center++;
        if (local[F33]==man) center++;
        if (local[F29]==man) center++;
        if (local[F38]==man) center++;
        if (local[F22]==man) center++;

        if (center>=6) eval[c]+=70;
        else if (center>=5) eval[c]+=40;
        else if (center>=4) eval[c]+=30;
        else if (center>=3) eval[c]+=20;
        D("17",eval[c]);
        /* near-promotion correction terms             **
                                                     ww           
                              wO                   bb            
                            **  bO        &      ww  ..        
                              ..  wO           ww  ..         
                                    **       **             
        */
        //if (local[F46]==empty && local[F47]==man && local[F41]==(black|man) && local[F36]==man) eval[c]-=800;
        if (local[F49]==man && local[F50]==empty && local[F44]==man && local[F45]==empty && local[F40]==(black|man) && local[F35]==man) eval[c]-=700;
    D("18",eval[c]);

        /*               bb
                       **  ww
        	         ..  ww
        	           ww
        	         ..
        	       **  **
               */
        if (local[F46]==empty && local[F41]==man && local[F36]==empty && local[F37]==man && local[F31]==man && local[F26]==(black|man)) eval[c]-=parameters[6];
        /*            bb
                               ..
                             bb  ww
                           ..  ..
                             ..  ..
                           ..  ..
        */
        if (local[F50]==empty && local[F49]==empty && local[F45]==empty && local[F44]==empty && local[F40]==empty && local[F39]==empty && local[F35]==(white|man) && local[F34]==(black|man) && local[F30]==empty &&  local[F24]==(black|man)) eval[c]-=150;

        /*  45/40/34      b?
                            b?
        		      ww
                                       ww  **
                                         ww      */
       /*   bb
              ..
            ..  ww
       */
       //if (local[F36]==(black|man) and local[F41]==empty && local[
       if (local[F45]==(white|man) && local[F40]==(white|man) && local[F34]==(white|man) && (local[F29]==(black|man) || local[F23]==(black|man)) ) { eval[c]+=12;D("45/40/34",eval[c]);}

        /*    bb
                   **  bb 
                     ..  ww
                       ??  ww
                     ..  ..
        */
        D("19",eval[c]);
        if (local[F26]==(black|man) && local[F31]==(black|man) &&
                local[F36]==empty && local[F37]==(white|man) &&
            local[F46]==empty && local[F47]==empty) {eval[c]-=56;D("breaktrough left corner",-56);}
#ifdef DEBUG
        dprint("fixed patterns:%i\n",eval[c]-olde);
        dprint("mobility:%i\n",4*mobil[c]);
        dprint("eval column:%i\n",eval_colunm(c));
        dprint("active:%i\n",parameters[15]*nactive[c]);
        dprint("blocked:%i\n",-5*nblock[c]);
        dprint("control:%i\n",control);
#endif
    }
    if (stage==0) mscore=6;
    else if (stage==1) mscore=9;
    else if (stage==2) mscore=9;
    if (eval_type==99) {
        if (stage==0) mscore=4;
        else if (stage==1) mscore=6;
        else if (stage==2) mscore=6;
    }
    pos=control+eval[0]-eval[1]+mscore*(mobil[0]-mobil[1])+eval_colunm(color)+parameters[15]*(nactive[0]-nactive[1])-5*(nblock[0]-nblock[1]);

    //dprint("c1: %i\n",largeCenter[0]);
    //dprint("c1: %i\n",largeCenter[1]);
    //dprint("c2: %i\n",(largeCenter[color]-largeCenter[color^1])*(22-totalman)*2);
    if (eval_type==0) pos+=(largeCenter[color]-largeCenter[color^1])*9;
    if (eval_type<2) {
        pos+=btEval(color);
        //if (btEval(color)!=0) {
        //    display_board();
        //    printf("c: %i, ev: %i, bt: %i i/%i/%i\n\n",color,mat+pos+parscore,btEval(color),mat,pos,parscore);
       // }
    }

#ifdef RANDOM
    pos+=hash_key(color)%32-16; /* add random value */
#endif
    if (mcrown>0 && ecrown>0) {
        /* crowns on board: move to draw*/
        if ((mman+mcrown)<=3 && (eman+ecrown)<=3) pos/=32; /* drawish ending */
        else if ((mman+mcrown)<=5 && (eman+ecrown)<=5) pos/=4; /* drawish ending */
        else pos/=2;
    }
    if (mman<=5 && mman==eman && mcrown==0 && ecrown==0) parscore=parity_score(color);
    
    /* anti-exchange */
    if (blockingPlay!=0) {
        if (color==game_color) {
            pos+=(mman-startMan)*blockingPlay;
        } else {
            pos-=(eman-startMan)*blockingPlay;
        }
    }   
    //winprint("et: %i\n",eval_type); 
    //store_eval(color,mat+pos+parscore);
    *precise=true;
    return(mat+pos+parscore);
}

#undef OWN
#undef OPP
#undef FREE

#define FREE 0
#define OWN 2
#define OPP 4
#define NEW 8
#define BRANDNEW 16

#define MIN(a,b) (a<b?a:b)
int abc_1=0, abc_2=0;

int field_control(int color)
/* returns the field control score for 'color' */
/* only works if no crowns are present */
{
    unsigned char own[93],control[93];
    int ip,p,i,col,ocolor,change[5];
    int c,n,y,x,delta=0,score=0;
    int steps=0;
    int my_z,op_z,p1,p2,op1,op2;

    /* initialise */
    ocolor=color^1;
    for(i=0;i<50;i++) own[map[i]]=control[map[i]]=FREE;

    /* first round: copy board to own and control arrays */
    for(ip=0;ip<50;ip++) {
        i=map[ip];
        if (board[i]==(color|man)) {
            own[i]=steps+32;
            control[i]=OWN;
            if ((color==white && ip<45) || color==black && ip>=5) {
                control[i-1]|=OWN;
                control[i+1]|=OWN;
            }
            control[next[color][i][0]]|=OWN;
            control[next[color][i][1]]|=OWN;
            control[next[color][i][2]]|=OWN;
            control[next[color][i][3]]|=OWN;
        }
        else if (board[i]==(ocolor|man)) {
            own[i]=steps+64;
            control[i]=OPP;
            if ((ocolor==white && ip<45) || ocolor==black && ip>=5) {
                control[i-1]|=OPP;
                control[i+1]|=OPP;
            }
            control[next[ocolor][i][0]]|=OPP;
            control[next[ocolor][i][1]]|=OPP;
            control[next[ocolor][i][2]]|=OPP;
            control[next[ocolor][i][3]]|=OPP;
        }
    }

    c=OWN;
    change[OWN]=change[OPP]=true;
    col=color;
    do {
        change[c]=false;

        for(ip=0;ip<50;ip++) {
            i=map[ip];
            if ((c==OWN && own[i]==(steps+32)) || (c==OPP && own[i]==(steps+63))) {
                if (control[n=next[col][i][forleft]]==c) if (own[n]==FREE) {
                        if (c==OWN) own[n]=steps+34;
                        else own[n]=steps+65;
                        control[next[col][n][0]]|=c;
                        control[next[col][n][1]]|=c;
                        control[next[col][n][2]]|=c;
                        control[next[col][n][3]]|=c;
                        change[c]=true;
                    }
                if (control[n=next[col][i][forright]]==c) if (own[n]==FREE) {
                        if (c==OWN) own[n]=steps+34;
                        else own[n]=steps+65;
                        control[next[col][n][0]]|=c;
                        control[next[col][n][1]]|=c;
                        control[next[col][n][2]]|=c;
                        control[next[col][n][3]]|=c;
                        change[c]=true;
                    }

            }
        }
        steps++;

        c=OPP+OWN-c;
        col^=1;

    } while(change[OWN]==true || change[OPP]==true);
    for(i=0;i<50;i++) {
        if ((own[map[i]]&32)!=0) delta++;
        else if ((own[map[i]]&64)!=0) delta--;
    }
    score=parameters[12]*delta;
    abc_1+=score; abc_2++;
    /* promotion */
    if (color==white) {
        p1=0; p2=5; op1=45;op2=50;
    } else {p1=45; p2=50; op1=0; op2=5;}

    /* my promotions */
    my_z=100;
    for(i=p1;i<p2;i++) {
        if ((own[map[i]]&32)!=0) my_z=MIN(my_z,own[map[i]]-33);
    }
    /* opponents promotions */
    op_z=100;
    for(i=op1;i<op2;i++) {
        if ((own[map[i]]&64)!=0) op_z=MIN(op_z,own[map[i]]-64);
    }
    /*printf("m:%i o:%i\n",my_z,op_z);*/
    if (my_z!=100) score+=near_promo[my_z];
    if (op_z!=100) score-=near_promo[op_z];
    
    return(score);
    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) printf("  ");
            else {
                if ((own[map[p]]&32)!=0) printf("M%c",(char) (own[map[p]]-32+48));
                else if ((own[map[p]]&64)!=0) printf("O%c",(char)(own[map[p]]-64+48));
                else printf("..");
                p++;
            }

        }
        printf("\n");
    }
    printf("\n");

    p=0;
    for(y=0;y<10;y++) {
        for(x=0;x<10;x++) {
            if ((x+y)%2==0) printf("  ");
            else {
                switch(control[map[p]]) {
                case FREE:   printf(".."); break;
                case OWN:    printf("Me"); break;
                case OPP: printf("Yy"); break;
                default: printf("??"); break;
                }
                p++;
            }
        }
        printf("\n");
    }
    return(score);


}

