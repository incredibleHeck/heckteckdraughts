
main()
{
    unsigned int bit=0x80000000, sum=0;
    int x;
    int i;
    for (i=0;i<3000048;i++) {
        x=malloc(16*1024*1024);
        sum+=16*1024*1024;
        printf("%i %i\n",i,sum);
        if (x==0) break;
    }
    printf("%i\n",x);

    while (bit > 4096)
    {
        x = malloc(bit);
        if (x)
            sum += bit;
        bit >>= 1;
    }
    printf("%08x bytes (%.1fMb)\n", sum, sum/1024.0/1024.0);
    return 0;
}
